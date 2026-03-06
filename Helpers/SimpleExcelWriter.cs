using System.Data;
using System.Reflection;
using OfficeOpenXml;
using OfficeOpenXml.Table;

namespace SriPayroll.Helpers;

public class SimpleExcelWriter: IDisposable
{
    public TableStyles TableStyle = TableStyles.Light2;

    private readonly ExcelPackage _excel;
    private readonly List<SimpleExcelWorksheet> _worksheets;

    public SimpleExcelWriter()
    {
        _excel = new ExcelPackage();
        _worksheets = new List<SimpleExcelWorksheet>();
    }

    public void AddWorksheet(SimpleExcelWorksheet sheet)
    {
        _worksheets.Add(sheet);
    }

    public void BuildWorkbook()
    {
        var sheetNum = 1;
        foreach (var sheet in _worksheets)
        {
            var ws = _excel.Workbook.Worksheets.Add(sheet.WorksheetName);
            const int startRow = 1;

            ws.Cells["A" + startRow].LoadFromDataTable(sheet.DataTable, true);

            if (sheet.ColumnWidths != null)
            {
                for (var i = 1; i < sheet.ColumnWidths.Length; i++)
                    ws.Column(i).Width = sheet.ColumnWidths[i];
            }
            else
            {
                ws.Cells.AutoFitColumns();                
            }

            // format as table
            var tableRange = ws.Cells[startRow, 1, startRow + sheet.DataTable.Rows.Count, sheet.DataTable.Columns.Count];
            var table = ws.Tables.Add(tableRange, "Table_" + sheetNum);
            table.TableStyle = TableStyle;

            foreach (var entry in sheet.ColumnFormats)
            {
                ws.Column(entry.Key).Style.Numberformat.Format = entry.Value;
            }

            sheetNum++;
        }
    }

    public void WriteToResponse(HttpResponse response, string filename)
    {
        if (!filename.EndsWith(".xlsx")) filename += ".xlsx";

        response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        response.Headers.Add("content-disposition", $"attachment;  filename=\"{filename}\"");
        response.Body.WriteAsync(_excel.GetAsByteArray());
    }

    public void Dispose()
    {
        if (_excel != null) _excel.Dispose();
    }
}

public class SimpleExcelWorksheet
{
    public string WorksheetName { get; set; }
    public DataTable DataTable { get; set; }
    public double[]? ColumnWidths { get; set; }
    private readonly Dictionary<int, string> _columnFormats = new Dictionary<int, string>();
    public Dictionary<int, string> ColumnFormats
    {
        get { return _columnFormats; }
    }

    public void SetColumnFormat(int column, string format)
    {
        _columnFormats.Add(column, format);
    }

    public void SetColumnAsDate(int column, string dateFormat = "dd/mm/yyyy")
    {
        SetColumnFormat(column, dateFormat);
    }

    public void SetColumnAsCurrency(int column, string format = "#,##0")
    {
        SetColumnFormat(column, format);
    }
}

public class ObjectShredder<T>
{
    private System.Reflection.FieldInfo[] _fi;
    private System.Reflection.PropertyInfo[] _pi;
    private System.Collections.Generic.Dictionary<string, int> _ordinalMap;
    private System.Type _type;

    // ObjectShredder constructor.
    public ObjectShredder()
    {
        _type = typeof(T);
        _fi = _type.GetFields();
        _pi = _type.GetProperties();
        _ordinalMap = new Dictionary<string, int>();
    }

    /// <summary>
    /// Loads a DataTable from a sequence of objects.
    /// </summary>
    /// <param name="source">The sequence of objects to load into the DataTable.</param>
    /// <param name="table">The input table. The schema of the table must match that
    /// the type T.  If the table is null, a new table is created with a schema
    /// created from the public properties and fields of the type T.</param>
    /// <param name="options">Specifies how values from the source sequence will be applied to
    /// existing rows in the table.</param>
    /// <returns>A DataTable created from the source sequence.</returns>
    public DataTable Shred(IEnumerable<T> source, DataTable table, LoadOption? options)
    {
        // Load the table from the scalar sequence if T is a primitive type.
        if (typeof(T).IsPrimitive)
        {
            return ShredPrimitive(source, table, options);
        }

        // Create a new table if the input table is null.
        if (table == null)
        {
            table = new DataTable(typeof(T).Name);
        }

        // Initialize the ordinal map and extend the table schema based on type T.
        table = ExtendTable(table, typeof(T));

        // Enumerate the source sequence and load the object values into rows.
        table.BeginLoadData();
        using (IEnumerator<T> e = source.GetEnumerator())
        {
            while (e.MoveNext())
            {
                if (options != null)
                {
                    table.LoadDataRow(ShredObject(table, e.Current), (LoadOption)options);
                }
                else
                {
                    table.LoadDataRow(ShredObject(table, e.Current), true);
                }
            }
        }
        table.EndLoadData();

        // Return the table.
        return table;
    }

    public DataTable ShredPrimitive(IEnumerable<T> source, DataTable table, LoadOption? options)
    {
        // Create a new table if the input table is null.
        if (table == null)
        {
            table = new DataTable(typeof(T).Name);
        }

        if (!table.Columns.Contains("Value"))
        {
            table.Columns.Add("Value", typeof(T));
        }

        // Enumerate the source sequence and load the scalar values into rows.
        table.BeginLoadData();
        using (IEnumerator<T> e = source.GetEnumerator())
        {
            Object[] values = new object[table.Columns.Count];
            while (e.MoveNext())
            {
                values[table.Columns["Value"].Ordinal] = e.Current;

                if (options != null)
                {
                    table.LoadDataRow(values, (LoadOption)options);
                }
                else
                {
                    table.LoadDataRow(values, true);
                }
            }
        }
        table.EndLoadData();

        // Return the table.
        return table;
    }

    public object[] ShredObject(DataTable table, T instance)
    {
        FieldInfo[] fi = _fi;
        PropertyInfo[] pi = _pi;

        if (instance.GetType() != typeof(T))
        {
            // If the instance is derived from T, extend the table schema
            // and get the properties and fields.
            ExtendTable(table, instance.GetType());
            fi = instance.GetType().GetFields();
            pi = instance.GetType().GetProperties();
        }

        // Add the property and field values of the instance to an array.
        Object[] values = new object[table.Columns.Count];
        foreach (FieldInfo f in fi)
        {
            values[_ordinalMap[f.Name]] = f.GetValue(instance);
        }

        foreach (PropertyInfo p in pi)
        {
            values[_ordinalMap[p.Name]] = p.GetValue(instance, null);
        }

        // Return the property and field values of the instance.
        return values;
    }

    public DataTable ExtendTable(DataTable table, Type type)
    {
        // Extend the table schema if the input table was null or if the value
        // in the sequence is derived from type T.
        foreach (FieldInfo f in type.GetFields())
        {
            if (!_ordinalMap.ContainsKey(f.Name))
            {
                // Add the field as a column in the table if it doesn't exist
                // already.
                DataColumn dc = table.Columns.Contains(f.Name)
                    ? table.Columns[f.Name]
                    : table.Columns.Add(f.Name, f.FieldType);

                // Add the field to the ordinal map.
                _ordinalMap.Add(f.Name, dc.Ordinal);
            }
        }
        foreach (PropertyInfo p in type.GetProperties())
        {
            if (!_ordinalMap.ContainsKey(p.Name))
            {
                // Add the property as a column in the table if it doesn't exist
                // already.
                DataColumn dc = table.Columns.Contains(p.Name)
                    ? table.Columns[p.Name]
                    : table.Columns.Add(p.Name, Nullable.GetUnderlyingType(p.PropertyType) ?? p.PropertyType);

                // Add the property to the ordinal map.
                _ordinalMap.Add(p.Name, dc.Ordinal);
            }
        }

        // Return the table.
        return table;
    }
}

public static class LinqToDataTableMethods
{
    public static DataTable CopyToDataTable<T>(this IEnumerable<T> source)
    {
        return new ObjectShredder<T>().Shred(source, null, null);
    }

    public static DataTable CopyToDataTable<T>(this IEnumerable<T> source,
        DataTable table, LoadOption? options)
    {
        return new ObjectShredder<T>().Shred(source, table, options);
    }
}