using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public partial class SkContext : DbContext
{
    public SkContext()
    {
    }

    public SkContext(DbContextOptions<SkContext> options)
        : base(options)
    {
    }

    public virtual DbSet<DokumenAdministrasi> DokumenAdministrasis { get; set; }

    public virtual DbSet<KegiatanDosen> KegiatanDosens { get; set; }

    public virtual DbSet<RefJenisDokuman> RefJenisDokumen { get; set; }

    public virtual DbSet<RefKategoriKum> RefKategoriKums { get; set; }

    public virtual DbSet<RefKegiatanKum> RefKegiatanKums { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UsulanKenaikanPangkat> UsulanKenaikanPangkats { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=172.17.10.15;Database=aurora;Username=aurora;Password=Gunung@Mer4pi?");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("chunktypeenum", new[] { "title", "keywords", "abstract" })
            .HasPostgresEnum("roleenum", new[] { "user", "assistant" })
            .HasPostgresEnum("statusenum", new[] { "success", "failed", "fallback" })
            .HasPostgresExtension("pg_trgm")
            .HasPostgresExtension("vector");

        modelBuilder.Entity<DokumenAdministrasi>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("dokumen_administrasi_pkey");

            entity.ToTable("dokumen_administrasi", "sk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DocumentUrl).HasColumnName("document_url");
            entity.Property(e => e.JenisDokumen).HasColumnName("jenis_dokumen");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("uploaded_at");
            entity.Property(e => e.UsulanId).HasColumnName("usulan_id");

            entity.HasOne(d => d.JenisDokumenNavigation).WithMany(p => p.DokumenAdministrasis)
                .HasForeignKey(d => d.JenisDokumen)
                .HasConstraintName("dokumen_administrasi_jenis_dokumen_fkey");

            entity.HasOne(d => d.Usulan).WithMany(p => p.DokumenAdministrasis)
                .HasForeignKey(d => d.UsulanId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("dokumen_administrasi_usulan_id_fkey");
        });

        modelBuilder.Entity<KegiatanDosen>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("kegiatan_dosen_pkey");

            entity.ToTable("kegiatan_dosen", "sk");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DocumentHash)
                .HasMaxLength(66)
                .HasColumnName("document_hash");
            entity.Property(e => e.DocumentUrl).HasColumnName("document_url");
            entity.Property(e => e.DosenId).HasColumnName("dosen_id");
            entity.Property(e => e.KeteranganAdmin).HasColumnName("keterangan_admin");
            entity.Property(e => e.PoinKum)
                .HasPrecision(5, 2)
                .HasColumnName("poin_kum");
            entity.Property(e => e.RefKegiatanId).HasColumnName("ref_kegiatan_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.TxHashStore)
                .HasMaxLength(66)
                .HasColumnName("tx_hash_store");
            entity.Property(e => e.TxHashVerify)
                .HasMaxLength(66)
                .HasColumnName("tx_hash_verify");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Dosen).WithMany(p => p.KegiatanDosens)
                .HasForeignKey(d => d.DosenId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("kegiatan_dosen_dosen_id_fkey");

            entity.HasOne(d => d.RefKegiatan).WithMany(p => p.KegiatanDosens)
                .HasForeignKey(d => d.RefKegiatanId)
                .HasConstraintName("kegiatan_dosen_ref_kegiatan_id_fkey");
        });

        modelBuilder.Entity<RefJenisDokuman>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ref_jenis_dokumen_pkey");

            entity.ToTable("ref_jenis_dokumen", "sk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nama)
                .HasMaxLength(100)
                .HasColumnName("nama");
        });

        modelBuilder.Entity<RefKategoriKum>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ref_kategori_kum_pkey");

            entity.ToTable("ref_kategori_kum", "sk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Deskripsi).HasColumnName("deskripsi");
            entity.Property(e => e.NamaKategori)
                .HasMaxLength(100)
                .HasColumnName("nama_kategori");
        });

        modelBuilder.Entity<RefKegiatanKum>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ref_kegiatan_kum_pkey");

            entity.ToTable("ref_kegiatan_kum", "sk");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.KategoriId).HasColumnName("kategori_id");
            entity.Property(e => e.NamaKegiatan)
                .HasMaxLength(255)
                .HasColumnName("nama_kegiatan");
            entity.Property(e => e.PoinMaksimal)
                .HasPrecision(5, 2)
                .HasColumnName("poin_maksimal");
            entity.Property(e => e.SyaratDokumen).HasColumnName("syarat_dokumen");

            entity.HasOne(d => d.Kategori).WithMany(p => p.RefKegiatanKums)
                .HasForeignKey(d => d.KategoriId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("ref_kegiatan_kum_kategori_id_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users", "sk");

            entity.HasIndex(e => e.NipNidn, "users_nip_nidn_key").IsUnique();

            entity.HasIndex(e => e.PublicId, "users_public_id_key").IsUnique();

            entity.HasIndex(e => e.WalletAddress, "users_wallet_address_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.JabatanSaatIni)
                .HasMaxLength(100)
                .HasColumnName("jabatan_saat_ini");
            entity.Property(e => e.NamaLengkap)
                .HasMaxLength(255)
                .HasColumnName("nama_lengkap");
            entity.Property(e => e.NipNidn)
                .HasMaxLength(50)
                .HasColumnName("nip_nidn");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.PublicId)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("public_id");
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .HasColumnName("role");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.WalletAddress)
                .HasMaxLength(42)
                .HasColumnName("wallet_address");
        });

        modelBuilder.Entity<UsulanKenaikanPangkat>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("usulan_kenaikan_pangkat_pkey");

            entity.ToTable("usulan_kenaikan_pangkat", "sk");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DosenId).HasColumnName("dosen_id");
            entity.Property(e => e.JabatanTujuan)
                .HasMaxLength(100)
                .HasColumnName("jabatan_tujuan");
            entity.Property(e => e.SkDocumentHash)
                .HasMaxLength(66)
                .HasColumnName("sk_document_hash");
            entity.Property(e => e.SkDocumentUrl).HasColumnName("sk_document_url");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Draft'::character varying")
                .HasColumnName("status");
            entity.Property(e => e.TotalPoinDiajukan)
                .HasPrecision(8, 2)
                .HasColumnName("total_poin_diajukan");
            entity.Property(e => e.TxHashSk)
                .HasMaxLength(66)
                .HasColumnName("tx_hash_sk");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Dosen).WithMany(p => p.UsulanKenaikanPangkats)
                .HasForeignKey(d => d.DosenId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("usulan_kenaikan_pangkat_dosen_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
