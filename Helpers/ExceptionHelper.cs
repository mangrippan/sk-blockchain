using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;

namespace SriPayroll.Helpers
{
    public class ExceptionHelper
    {
        public string message;

        public string ExceptionMessage(WebException e)
        {
            HttpWebResponse errorResponse = e.Response as HttpWebResponse;
            if (errorResponse.StatusCode == HttpStatusCode.NotFound)
            {
                message = "Halaman yang anda cari tidak ditemukan";
            }
            else if (errorResponse.StatusCode == HttpStatusCode.RequestTimeout)
            {
                message = "Server sedang sibuk. Silahkan coba beberapa saat lagi";
            }
            else if (errorResponse.StatusCode == HttpStatusCode.Forbidden)
            {
                message = "Maaf yah, anda ditolak sama server";
            }
            else if (errorResponse.StatusCode == HttpStatusCode.BadRequest)
            {
                message = "Jangan klik yang aneh-aneh. Ikuti aturan yang ada";
            }
            else if (errorResponse.StatusCode == HttpStatusCode.GatewayTimeout)
            {
                message = "Server sedang sibuk. Silahkan coba beberapa saat lagi";
            }
            //else if (errorResponse.StatusCode == HttpStatusCode.InternalServerError)
            //{
            //    message = "Terjadi kesalahan pada jaringan koneksi anda";
            //}
            else
            {
                message = "Kita mendapat masalah yang biasanya tidak terjadi. <br/>Silahkan coba beberapa saat lagi jika tidak bisa, hubungi Admin Sistem";
            }

            return message;
        }

    }

    public class AsyncResponse
    {
        public bool Stat { get; set; }
        public string Message { get; set; }
    }
}