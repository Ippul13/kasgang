export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      const getBody = async () => {
        const ct = request.headers.get('content-type') || '';
        if (ct.includes('application/json')) return await request.json();
        const fd = await request.formData();
        return Object.fromEntries(fd.entries());
      };

      // ── LOGIN ──────────────────────────────────────────────────────────────
      if (path === '/api/login' && method === 'POST') {
        const { username, password } = await getBody();
        const ok =
          username === (env.ADMIN_USERNAME || 'admin') &&
          password === (env.ADMIN_PASSWORD || 'admin123');
        return ok
          ? json({ status: 'success', message: 'Login berhasil' })
          : json({ status: 'error', message: 'Username atau password salah' }, 401);
      }

      // ── TRANSACTIONS ───────────────────────────────────────────────────────
      if (path === '/api/transactions') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id, tanggal as Tanggal, jenis as Jenis, nominal as Nominal, keterangan as Keterangan, timestamp as Timestamp FROM transactions ORDER BY tanggal ASC'
          ).all();
          return json({ status: 'success', data: results });
        }

        if (method === 'POST') {
          const { tanggal, jenis, nominal, keterangan } = await getBody();
          if (!tanggal || !jenis || !nominal || !keterangan)
            return json({ status: 'error', message: 'Field tidak lengkap' }, 400);
          await env.DB.prepare(
            'INSERT INTO transactions (tanggal, jenis, nominal, keterangan) VALUES (?, ?, ?, ?)'
          ).bind(tanggal, jenis, parseFloat(nominal), keterangan).run();
          return json({ status: 'success', message: 'Transaksi berhasil disimpan' });
        }

        if (method === 'DELETE') {
          const id = url.searchParams.get('id');
          if (!id) return json({ status: 'error', message: 'ID diperlukan' }, 400);
          await env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
          return json({ status: 'success', message: 'Transaksi berhasil dihapus' });
        }
      }

      // ── IURAN ──────────────────────────────────────────────────────────────
      if (path === '/api/iuran') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT rumah as Rumah, nama as Nama, jan as Jan, feb as Feb, mar as Mar, apr as Apr, mei as Mei, juni as Juni, juli as Juli, agu as Agu, sep as Sep, okt as Okt, nov as Nov, des as Des, hut_ri as HutRI, thr_security as ThrSecurity, partisipasi_ronda as PartisipasiRonda FROM iuran'
          ).all();
          return json({ status: 'success', data: results });
        }

        if (method === 'POST') {
          const body = await getBody();
          const { Rumah, Nama, Jan, Feb, Mar, Apr, Mei, Juni, Juli, Agu, Sep, Okt, Nov, Des, HutRI, ThrSecurity, PartisipasiRonda, originalRumah } = body;
          if (!Rumah || !Nama) return json({ status: 'error', message: 'Rumah dan Nama harus diisi' }, 400);
          const v = (x) => x || '-';
          const vn = (x) => (x === '' || x === null || x === undefined) ? 0 : parseInt(x);
          if (originalRumah) {
            await env.DB.prepare(
              'UPDATE iuran SET rumah=?,nama=?,jan=?,feb=?,mar=?,apr=?,mei=?,juni=?,juli=?,agu=?,sep=?,okt=?,nov=?,des=?,hut_ri=?,thr_security=?,partisipasi_ronda=? WHERE rumah=?'
            ).bind(Rumah, Nama, v(Jan), v(Feb), v(Mar), v(Apr), v(Mei), v(Juni), v(Juli), v(Agu), v(Sep), v(Okt), v(Nov), v(Des), vn(HutRI), vn(ThrSecurity), vn(PartisipasiRonda), originalRumah).run();
          } else {
            await env.DB.prepare(
              'INSERT OR REPLACE INTO iuran (rumah,nama,jan,feb,mar,apr,mei,juni,juli,agu,sep,okt,nov,des,hut_ri,thr_security,partisipasi_ronda) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            ).bind(Rumah, Nama, v(Jan), v(Feb), v(Mar), v(Apr), v(Mei), v(Juni), v(Juli), v(Agu), v(Sep), v(Okt), v(Nov), v(Des), vn(HutRI), vn(ThrSecurity), vn(PartisipasiRonda)).run();
          }
          return json({ status: 'success', message: 'Data iuran berhasil disimpan' });
        }

        if (method === 'DELETE') {
          const rumah = url.searchParams.get('rumah');
          if (!rumah) return json({ status: 'error', message: 'Parameter rumah diperlukan' }, 400);
          await env.DB.prepare('DELETE FROM iuran WHERE rumah = ?').bind(rumah).run();
          return json({ status: 'success', message: 'Warga berhasil dihapus' });
        }
      }

      // ── INVENTARIS ─────────────────────────────────────────────────────────
      if (path === '/api/inventaris') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT no, nama, kategori, jumlah, kondisi, lokasi, keterangan FROM inventaris ORDER BY no ASC'
          ).all();
          return json({ status: 'success', data: results });
        }

        if (method === 'POST') {
          const { no, nama, kategori, jumlah, kondisi, lokasi, keterangan } = await getBody();
          if (!no || !nama || !kategori || !jumlah || !kondisi || !lokasi)
            return json({ status: 'error', message: 'Field tidak valid' }, 400);
          await env.DB.prepare(
            'INSERT OR REPLACE INTO inventaris (no,nama,kategori,jumlah,kondisi,lokasi,keterangan) VALUES (?,?,?,?,?,?,?)'
          ).bind(parseInt(no), nama, kategori, parseInt(jumlah), kondisi, lokasi, keterangan || '').run();
          return json({ status: 'success', message: 'Inventaris berhasil disimpan' });
        }

        if (method === 'DELETE') {
          const no = url.searchParams.get('no');
          if (!no) return json({ status: 'error', message: 'Parameter no diperlukan' }, 400);
          await env.DB.prepare('DELETE FROM inventaris WHERE no = ?').bind(no).run();
          return json({ status: 'success', message: 'Inventaris berhasil dihapus' });
        }
      }

      // ── PROGRAM KERJA ──────────────────────────────────────────────────────
      if (path === '/api/program') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT no, program, pic, target, status, keterangan FROM program_kerja ORDER BY no ASC'
          ).all();
          return json({ status: 'success', data: results });
        }

        if (method === 'POST') {
          const { no, program, pic, target, status, keterangan } = await getBody();
          if (!no || !program || !pic || !target || !status)
            return json({ status: 'error', message: 'Field tidak valid' }, 400);
          await env.DB.prepare(
            'INSERT OR REPLACE INTO program_kerja (no,program,pic,target,status,keterangan) VALUES (?,?,?,?,?,?)'
          ).bind(parseInt(no), program, pic, target, status, keterangan || '').run();
          return json({ status: 'success', message: 'Program kerja berhasil disimpan' });
        }

        if (method === 'DELETE') {
          const no = url.searchParams.get('no');
          if (!no) return json({ status: 'error', message: 'Parameter no diperlukan' }, 400);
          await env.DB.prepare('DELETE FROM program_kerja WHERE no = ?').bind(no).run();
          return json({ status: 'success', message: 'Program kerja berhasil dihapus' });
        }
      }

      // ── DATA WARGA ─────────────────────────────────────────────────────────
      // GET KK file (must be before /api/warga to avoid path conflict)
      if (path === '/api/warga/kk' && method === 'GET') {
        const id = url.searchParams.get('id');
        if (!id) return json({ status: 'error', message: 'ID diperlukan' }, 400);

        const row = await env.DB.prepare(
          'SELECT file_kk, file_kk_nama FROM data_warga WHERE id = ?'
        ).bind(id).first();

        if (!row || !row.file_kk)
          return json({ status: 'error', message: 'File KK tidak ditemukan' }, 404);

        return json({ status: 'success', file_kk: row.file_kk, file_kk_nama: row.file_kk_nama });
      }

      if (path === '/api/warga') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id, no_rumah, nama, no_telp, jumlah_anggota, file_kk_nama, (CASE WHEN file_kk IS NOT NULL THEN 1 ELSE 0 END) as has_kk, timestamp FROM data_warga ORDER BY no_rumah ASC'
          ).all();
          return json({ status: 'success', data: results });
        }

        if (method === 'POST') {
          const body = await getBody();
          const { id, no_rumah, nama, no_telp, jumlah_anggota, file_kk, file_kk_nama } = body;
          if (!no_rumah || !nama)
            return json({ status: 'error', message: 'Nomor rumah dan nama wajib diisi' }, 400);

          const anggota = parseInt(jumlah_anggota) || 1;

          if (id) {
            // Update — only overwrite file_kk if new file provided
            if (file_kk) {
              await env.DB.prepare(
                'UPDATE data_warga SET no_rumah=?,nama=?,no_telp=?,jumlah_anggota=?,file_kk=?,file_kk_nama=? WHERE id=?'
              ).bind(no_rumah, nama, no_telp || '', anggota, file_kk, file_kk_nama || '', parseInt(id)).run();
            } else {
              await env.DB.prepare(
                'UPDATE data_warga SET no_rumah=?,nama=?,no_telp=?,jumlah_anggota=? WHERE id=?'
              ).bind(no_rumah, nama, no_telp || '', anggota, parseInt(id)).run();
            }
          } else {
            await env.DB.prepare(
              'INSERT INTO data_warga (no_rumah,nama,no_telp,jumlah_anggota,file_kk,file_kk_nama) VALUES (?,?,?,?,?,?)'
            ).bind(no_rumah, nama, no_telp || '', anggota, file_kk || null, file_kk_nama || null).run();
          }
          return json({ status: 'success', message: 'Data warga berhasil disimpan' });
        }

        if (method === 'DELETE') {
          const id = url.searchParams.get('id');
          if (!id) return json({ status: 'error', message: 'ID diperlukan' }, 400);
          await env.DB.prepare('DELETE FROM data_warga WHERE id = ?').bind(id).run();
          return json({ status: 'success', message: 'Data warga berhasil dihapus' });
        }
      }

      // ── GALERI (R2) ────────────────────────────────────────────────────────
      //
      // Foto tersimpan di R2 bucket "galerigang".
      // Metadata (judul, keterangan, tag, r2_key, dll) di D1 tabel galeri.
      //
      // Endpoints:
      //   GET  /api/galeri              → list metadata
      //   POST /api/galeri              → upload foto baru (multipart/form-data)
      //   DELETE /api/galeri?id=X       → hapus foto (R2 + D1)
      //   GET  /api/galeri/img?key=X    → stream foto dari R2
      //   POST /api/galeri/sync         → admin: rebuild metadata D1 dari R2 objects

      // Serve foto langsung dari R2
      if (path === '/api/galeri/img' && method === 'GET') {
        const key = url.searchParams.get('key');
        if (!key) return json({ status: 'error', message: 'key diperlukan' }, 400);

        const obj = await env.GALERI_BUCKET.get(decodeURIComponent(key));
        if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders });

        const ct = obj.httpMetadata?.contentType || 'image/jpeg';
        return new Response(obj.body, {
          headers: {
            'Content-Type': ct,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Sync: list semua objects R2 dan kembalikan sebagai JSON (untuk rekonstruksi manual)
      if (path === '/api/galeri/r2list' && method === 'GET') {
        const listed = await env.GALERI_BUCKET.list({ prefix: 'galeri/' });
        const objects = listed.objects.map(o => ({
          key: o.key,
          size: o.size,
          uploaded: o.uploaded,
        }));
        return json({ status: 'success', objects, truncated: listed.truncated });
      }

      // Restore: daftarkan metadata untuk r2_key yang sudah ada di bucket
      if (path === '/api/galeri/restore' && method === 'POST') {
        const body = await getBody();
        const { r2_key, judul, keterangan, tag, foto_nama, content_type } = body;
        if (!r2_key) return json({ status: 'error', message: 'r2_key diperlukan' }, 400);

        // Cek apakah object benar-benar ada di R2
        const obj = await env.GALERI_BUCKET.head(r2_key);
        if (!obj) return json({ status: 'error', message: 'Object tidak ditemukan di R2' }, 404);

        // Cek apakah sudah ada di D1
        const existing = await env.DB.prepare('SELECT id FROM galeri WHERE r2_key = ?').bind(r2_key).first();
        if (existing) return json({ status: 'success', message: 'Sudah terdaftar', skipped: true });

        await env.DB.prepare(
          'INSERT INTO galeri (judul, keterangan, tag, r2_key, foto_nama, content_type) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          judul || foto_nama || r2_key,
          keterangan || '',
          tag || '',
          r2_key,
          foto_nama || '',
          content_type || 'image/jpeg'
        ).run();

        return json({ status: 'success', message: 'Metadata berhasil dipulihkan' });
      }

      if (path === '/api/galeri') {
        // ── List metadata ──────────────────────────────────────────────────
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id, judul, keterangan, tag, r2_key, foto_nama, content_type, timestamp FROM galeri ORDER BY timestamp DESC'
          ).all();
          return json({ status: 'success', data: results });
        }

        // ── Upload foto baru ───────────────────────────────────────────────
        if (method === 'POST') {
          const ct = request.headers.get('content-type') || '';
          if (!ct.includes('multipart/form-data')) {
            return json({ status: 'error', message: 'Gunakan multipart/form-data untuk upload foto' }, 400);
          }

          const formData = await request.formData();
          const judul      = (formData.get('judul') || '').trim();
          const tag        = (formData.get('tag') || '').trim();
          const keterangan = (formData.get('keterangan') || '').trim();
          const fotoFile   = formData.get('foto');

          if (!judul)    return json({ status: 'error', message: 'Judul wajib diisi' }, 400);
          if (!fotoFile) return json({ status: 'error', message: 'File foto wajib diisi' }, 400);

          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
          const fileType = fotoFile.type || 'image/jpeg';
          if (!allowedTypes.includes(fileType))
            return json({ status: 'error', message: 'Format hanya JPG, PNG, WebP, atau GIF' }, 400);

          const fileBuffer = await fotoFile.arrayBuffer();
          if (fileBuffer.byteLength > 8 * 1024 * 1024)
            return json({ status: 'error', message: 'Ukuran foto maksimal 8MB' }, 400);

          const ext    = fileType.split('/')[1].replace('jpeg', 'jpg');
          const ts     = Date.now();
          const r2Key  = `galeri/${ts}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

          await env.GALERI_BUCKET.put(r2Key, fileBuffer, {
            httpMetadata: { contentType: fileType },
          });

          await env.DB.prepare(
            'INSERT INTO galeri (judul, keterangan, tag, r2_key, foto_nama, content_type) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(judul, keterangan, tag, r2Key, fotoFile.name || '', fileType).run();

          return json({ status: 'success', message: 'Foto berhasil diunggah', r2_key: r2Key });
        }

        // ── Hapus foto ─────────────────────────────────────────────────────
        if (method === 'DELETE') {
          const id = url.searchParams.get('id');
          if (!id) return json({ status: 'error', message: 'ID diperlukan' }, 400);

          const row = await env.DB.prepare('SELECT r2_key FROM galeri WHERE id = ?').bind(id).first();
          if (!row) return json({ status: 'error', message: 'Foto tidak ditemukan' }, 404);

          await env.GALERI_BUCKET.delete(row.r2_key);
          await env.DB.prepare('DELETE FROM galeri WHERE id = ?').bind(id).run();

          return json({ status: 'success', message: 'Foto berhasil dihapus' });
        }
      }
      // ── KRITIK & SARAN ─────────────────────────────────────────────────────
      if (path === '/api/saran') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id, nama, alamat, tanggal, detail, foto, timestamp FROM kritik_saran ORDER BY timestamp DESC'
          ).all();
          return json({ status: 'success', data: results });
        }

        if (method === 'POST') {
          const body = await getBody();
          const nama = (body.nama || '').trim() || 'Anonim';
          const alamat = (body.alamat || '').trim() || 'Rahasia';
          const { tanggal, detail, foto } = body;
          if (!tanggal || !detail)
            return json({ status: 'error', message: 'Tanggal dan detail wajib diisi' }, 400);
          await env.DB.prepare(
            'INSERT INTO kritik_saran (nama,alamat,tanggal,detail,foto) VALUES (?,?,?,?,?)'
          ).bind(nama, alamat, tanggal, detail.trim(), foto || null).run();
          return json({ status: 'success', message: 'Kritik & saran berhasil disimpan' });
        }

        if (method === 'DELETE') {
          const id = url.searchParams.get('id');
          if (!id) return json({ status: 'error', message: 'ID diperlukan' }, 400);
          await env.DB.prepare('DELETE FROM kritik_saran WHERE id = ?').bind(id).run();
          return json({ status: 'success', message: 'Laporan berhasil dihapus' });
        }
      }

      return json({ status: 'error', message: 'Not Found' }, 404);

    } catch (error) {
      return new Response(
        JSON.stringify({ status: 'error', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  },
};
