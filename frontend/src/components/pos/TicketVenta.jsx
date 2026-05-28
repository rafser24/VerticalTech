import { useRef } from 'react';
import { Printer, X, Zap, MapPin, Phone, Wifi } from 'lucide-react';

/**
 * TicketVenta
 * Ticket de consumidor final / no contribuyente para VerticalTech.
 * Se imprime via window.print() con estilos CSS dedicados.
 *
 * Props:
 *  - venta: objeto de la venta completada (del store o del API)
 *  - onClose: función para cerrar el modal del ticket
 */
export default function TicketVenta({ venta, onClose }) {
  const ticketRef = useRef(null);

  if (!venta) return null;

  const handleImprimir = () => {
    const contenido = ticketRef.current.innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=700');
    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Ticket — ${venta.numero_venta ?? ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'DM Sans', sans-serif;
            background: #fff;
            display: flex;
            justify-content: center;
            padding: 0;
          }

          .ticket {
            width: 80mm;
            max-width: 80mm;
            background: #fff;
            padding: 0;
            font-size: 11px;
            color: #1E293B;
          }

          /* ── Cabecera ── */
          .ticket-header {
            background: linear-gradient(160deg, #0F172A 0%, #1E3A8A 100%);
            padding: 18px 16px 14px;
            text-align: center;
            color: #fff;
          }
          .logo-icon {
            width: 36px; height: 36px;
            background: rgba(255,255,255,0.15);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 8px;
          }
          .empresa-nombre {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: #fff;
          }
          .empresa-nombre span { color: #60A5FA; }
          .eslogan {
            font-size: 8px;
            color: #93C5FD;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-top: 3px;
          }
          .empresa-datos {
            margin-top: 10px;
            font-size: 8.5px;
            color: #CBD5E1;
            line-height: 1.6;
          }
          .empresa-datos strong { color: #E2E8F0; }

          /* ── Corte dentado ── */
          .corte {
            height: 12px;
            background: #fff;
            position: relative;
            overflow: hidden;
          }
          .corte::before {
            content: '';
            position: absolute;
            top: -6px; left: -6px;
            width: calc(100% + 12px);
            height: 12px;
            background: radial-gradient(circle at 50% 0%, #fff 6px, transparent 6px),
                        radial-gradient(circle at 50% 0%, #0F172A 8px, transparent 8px);
            background-size: 16px 12px;
            background-position: 8px 0;
          }

          /* ── Sección info venta ── */
          .seccion {
            padding: 10px 14px;
            border-bottom: 1px dashed #CBD5E1;
          }
          .seccion-titulo {
            font-size: 7.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #2563EB;
            margin-bottom: 6px;
          }
          .fila-dato {
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            color: #475569;
            margin-bottom: 2px;
          }
          .fila-dato strong { color: #0F172A; font-weight: 500; }
          .numero-venta {
            font-family: 'DM Mono', monospace;
            font-size: 13px;
            font-weight: 500;
            color: #0F172A;
            letter-spacing: 0.04em;
            text-align: center;
            padding: 6px 0 2px;
          }
          .badge-tipo {
            display: inline-block;
            background: #EFF6FF;
            color: #1D4ED8;
            border: 1px solid #BFDBFE;
            border-radius: 4px;
            font-size: 7.5px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 2px 6px;
            margin: 0 auto 4px;
            display: block;
            text-align: center;
            width: fit-content;
          }

          /* ── Tabla de productos ── */
          .tabla-productos { padding: 10px 14px; border-bottom: 1px dashed #CBD5E1; }
          .tabla-header {
            display: grid;
            grid-template-columns: 1fr 28px 52px 52px;
            gap: 2px;
            font-size: 7.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94A3B8;
            padding-bottom: 5px;
            border-bottom: 1px solid #E2E8F0;
            margin-bottom: 5px;
          }
          .tabla-header span:not(:first-child),
          .tabla-fila span:not(:first-child) { text-align: right; }
          .tabla-fila {
            display: grid;
            grid-template-columns: 1fr 28px 52px 52px;
            gap: 2px;
            font-size: 9.5px;
            color: #334155;
            padding: 3px 0;
            border-bottom: 1px dotted #F1F5F9;
          }
          .tabla-fila .prod-nombre { font-weight: 500; color: #0F172A; font-size: 9.5px; }
          .tabla-fila .prod-sku { font-size: 7.5px; color: #94A3B8; font-family: 'DM Mono', monospace; }

          /* ── Totales ── */
          .totales { padding: 10px 14px; border-bottom: 1px dashed #CBD5E1; }
          .fila-total {
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            color: #64748B;
            margin-bottom: 3px;
          }
          .fila-total.descuento { color: #DC2626; }
          .fila-total.iva { color: #64748B; }
          .fila-total-final {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 2px solid #0F172A;
          }
          .fila-total-final .label {
            font-size: 11px;
            font-weight: 700;
            color: #0F172A;
          }
          .fila-total-final .monto {
            font-size: 16px;
            font-weight: 700;
            color: #1D4ED8;
            font-family: 'DM Mono', monospace;
          }

          /* ── Método de pago ── */
          .metodo-pago {
            padding: 8px 14px;
            border-bottom: 1px dashed #CBD5E1;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9.5px;
          }
          .metodo-pago .icono {
            width: 22px; height: 22px;
            background: #EFF6FF;
            border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
          }
          .metodo-pago strong { color: #0F172A; }

          /* ── Gracias ── */
          .gracias {
            padding: 14px;
            text-align: center;
          }
          .gracias-mensaje {
            font-size: 11px;
            font-weight: 600;
            color: #0F172A;
            margin-bottom: 3px;
          }
          .gracias-sub {
            font-size: 8.5px;
            color: #94A3B8;
          }

          /* ── QR placeholder ── */
          .qr-zona {
            margin: 10px auto;
            width: 60px; height: 60px;
            border: 2px solid #E2E8F0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #CBD5E1;
            text-align: center;
          }

          /* ── Redes sociales ── */
          .redes {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-top: 8px;
            font-size: 8px;
            color: #64748B;
          }

          /* ── Pie ── */
          .pie {
            background: #F8FAFC;
            padding: 8px 14px;
            text-align: center;
            font-size: 7.5px;
            color: #94A3B8;
            border-top: 1px dashed #CBD5E1;
          }
          .pie strong { color: #475569; }
        </style>
      </head>
      <body>
        <div class="ticket">${contenido}</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    ventana.document.close();
  };

  // ── Cálculos ──────────────────────────────────────────────────────────
  const subtotal  = parseFloat(venta.subtotal  ?? 0);
  const descuento = parseFloat(venta.descuento ?? 0);
  const impuesto  = parseFloat(venta.impuesto  ?? 0);
  const total     = parseFloat(venta.total     ?? 0);

  // Fecha y hora formateadas
  const fechaObj  = venta.fecha_venta ? new Date(venta.fecha_venta) : new Date();
  const fechaStr  = fechaObj.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr   = fechaObj.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full max-w-sm">
        {/* Controles */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Vista previa del ticket</h3>
          <div className="flex gap-2">
            <button
              onClick={handleImprimir}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors"
            >
              <Printer size={13} /> Imprimir
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Ticket preview */}
        <div className="overflow-y-auto flex-1 p-4 flex justify-center bg-gray-100">
          <div
            ref={ticketRef}
            style={{ width: '300px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', background: '#fff', color: '#1E293B' }}
          >
            {/* ── Header ── */}
            <div style={{ background: 'linear-gradient(160deg,#0F172A 0%,#1E3A8A 100%)', padding: '18px 16px 14px', textAlign: 'center', color: '#fff' }}>
              <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Zap size={20} color="#60A5FA" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
                Vertical<span style={{ color: '#60A5FA' }}>Tech</span>
              </div>
              <div style={{ fontSize: 8, color: '#93C5FD', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
                Soluciones inteligentes en tecnología
              </div>
              <div style={{ marginTop: 10, fontSize: 8.5, color: '#CBD5E1', lineHeight: 1.7 }}>
                <div>📍 Av. Alberto Masferrer, San Juan Nonualco , La Paz</div>
                <div>📞 +503 2334-3333 &nbsp;|&nbsp; <strong style={{ color: '#E2E8F0' }}>NIT:</strong> 0614-010101-001-0</div>
              </div>
            </div>

            {/* ── Corte dentado superior ── */}
            <div style={{ height: 10, background: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -5, left: 0, right: 0, height: 10, backgroundImage: 'radial-gradient(circle at 8px 0, #fff 5px, transparent 5px)', backgroundSize: '16px 10px' }} />
            </div>

            {/* ── Tipo de documento ── */}
            <div style={{ padding: '8px 14px 4px', textAlign: 'center' }}>
              <span style={{ display: 'inline-block', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 4, fontSize: 7.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px' }}>
                Ticket de Venta — Consumidor Final
              </span>
            </div>

            {/* ── Info venta ── */}
            <div style={{ padding: '6px 14px 10px', borderBottom: '1px dashed #CBD5E1' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#0F172A', textAlign: 'center', letterSpacing: '0.04em', marginBottom: 8 }}>
                {venta.numero_venta ?? `#${String(venta.id ?? '').padStart(6, '0')}`}
              </div>
              {[
                ['Fecha',   fechaStr],
                ['Hora',    horaStr],
                ['Cajero',  venta.usuario?.nombre ?? 'Sistema'],
                ['Cliente', venta.cliente ? `${venta.cliente.nombre ?? ''} ${venta.cliente.apellido ?? ''}`.trim() : 'Consumidor Final'],
              ].map(([label, valor]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#475569', marginBottom: 2 }}>
                  <span>{label}</span>
                  <strong style={{ color: '#0F172A', fontWeight: 500 }}>{valor}</strong>
                </div>
              ))}
            </div>

            {/* ── Productos ── */}
            <div style={{ padding: '10px 14px', borderBottom: '1px dashed #CBD5E1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 50px 50px', gap: 2, fontSize: 7.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', paddingBottom: 5, borderBottom: '1px solid #E2E8F0', marginBottom: 5 }}>
                <span>Producto</span>
                <span style={{ textAlign: 'right' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Precio</span>
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {(venta.detalles ?? venta.items ?? []).map((d, i) => {
                const nombre = d.producto?.nombre_producto ?? d.producto?.nombre ?? d.nombre ?? '—';
                const qty    = d.cantidad;
                const precio = parseFloat(d.precio_unitario ?? d.precio_venta ?? 0);
                const linea  = qty * precio - parseFloat(d.descuento ?? 0);
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 24px 50px 50px', gap: 2, fontSize: 9.5, color: '#334155', padding: '3px 0', borderBottom: '1px dotted #F1F5F9' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#0F172A' }}>{nombre}</div>
                      {d.producto?.codigo && <div style={{ fontSize: 7.5, color: '#94A3B8', fontFamily: 'monospace' }}>{d.producto.codigo}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>{qty}</div>
                    <div style={{ textAlign: 'right' }}>${precio.toFixed(2)}</div>
                    <div style={{ textAlign: 'right', fontWeight: 500 }}>${linea.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            {/* ── Totales ── */}
            <div style={{ padding: '10px 14px', borderBottom: '1px dashed #CBD5E1' }}>
              {[
                { label: 'Subtotal', valor: `$${subtotal.toFixed(2)}`, color: '#64748B' },
                descuento > 0 ? { label: 'Descuento', valor: `-$${descuento.toFixed(2)}`, color: '#DC2626' } : null,
                impuesto > 0  ? { label: `IVA (${((impuesto / (subtotal - descuento)) * 100).toFixed(0)}%)`, valor: `$${impuesto.toFixed(2)}`, color: '#64748B' } : null,
              ].filter(Boolean).map(({ label, valor, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color, marginBottom: 3 }}>
                  <span>{label}</span><span>{valor}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '2px solid #0F172A' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>TOTAL</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* ── Método de pago ── */}
            <div style={{ padding: '8px 14px', borderBottom: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: 8, fontSize: 9.5 }}>
              <div style={{ width: 24, height: 24, background: '#EFF6FF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                            </div>
              <div>
                <div style={{ color: '#64748B' }}>Método de pago</div>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>
                  {venta.metodo_pago?.nombre ?? venta.metodoPago?.nombre ?? '—'}
                </div>
              </div>
            </div>

            {/* ── Gracias ── */}
            <div style={{ padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                ¡Gracias por su compra! 
              </div>
              <div style={{ fontSize: 8.5, color: '#94A3B8', lineHeight: 1.6 }}>
                NO SE ACEPTAN DEVOLUCIONES.<br />
                
              </div>

             
              {/* Redes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 8, color: '#64748B', marginTop: 4 }}>
                <span>📘 /VerticalTech</span>
                <span>📸 @verticaltech_sv</span>
              </div>
            </div>

            {/* ── Corte dentado inferior ── */}
            <div style={{ height: 10, background: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 10, backgroundImage: 'radial-gradient(circle at 8px 100%, #fff 5px, transparent 5px)', backgroundSize: '16px 10px' }} />
            </div>

            {/* ── Pie ── */}
            <div style={{ background: '#F8FAFC', padding: '6px 14px', textAlign: 'center', fontSize: 7.5, color: '#94A3B8', borderTop: '1px dashed #CBD5E1' }}>
              <strong style={{ color: '#475569' }}>VerticalTech</strong> — Sistema POS v1.0<br />
              Documento no válido como crédito fiscal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
