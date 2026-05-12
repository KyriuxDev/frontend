// Web-only: mapa de calor con Leaflet cargado dinámicamente
import React, { useEffect, useRef } from 'react';
import { ComunidadResumen } from './comunidad.types';

// Coordenadas aproximadas de zonas de Oaxaca de Juárez
// En producción estas vendrían del backend junto con cada comunidad
const OAXACA_COORDS: [number, number][] = [
  [17.0672, -96.7201], // Centro histórico
  [17.0693, -96.7154], // Jalatlaco
  [17.0721, -96.7307], // Xochimilco
  [17.0764, -96.7261], // Reforma
  [17.0612, -96.7241], // El Rosario
  [17.0843, -96.7289], // Trinidad de Viguera
  [17.0580, -96.7180], // Sta. Rosa Panzacola
  [17.0810, -96.7140], // San Felipe del Agua
  [17.0650, -96.7380], // Sta. Lucía del Camino
  [17.0900, -96.7420], // San Agustín Yatareni
];

function irsuColor(irsu: number): string {
  if (irsu > 100) return '#dc2626';
  if (irsu > 50)  return '#d97706';
  return '#16a34a';
}

function irsuLabel(irsu: number): string {
  if (irsu > 100) return '⚠ CRÍTICO';
  if (irsu > 50)  return '⚠ ALERTA';
  return '✓ ESTABLE';
}

interface Props {
  comunidades: ComunidadResumen[];
}

export default function MapaComunidades({ comunidades }: Props) {
  const divRef  = useRef<HTMLDivElement>(null);
  const mapRef  = useRef<any>(null);

  useEffect(() => {
    if (!divRef.current) return;

    // ── CSS de Leaflet ────────────────────────────────────────────────
    if (!document.getElementById('leaflet-css')) {
      const link   = document.createElement('link');
      link.id      = 'leaflet-css';
      link.rel     = 'stylesheet';
      link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (mapRef.current || !divRef.current) return;

      const L   = (window as any).L;
      if (!L) return;

      // ── Instancia del mapa ─────────────────────────────────────────
      const map = L.map(divRef.current, {
        center:         [17.0732, -96.7266],
        zoom:           13,
        zoomControl:    false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tiles en escala de grises para imitar el mockup
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          // filtro CSS aplicado al contenedor del tile
          className: 'leaflet-tile-grayscale',
        },
      ).addTo(map);

      // Inyectamos el filtro CSS una sola vez
      if (!document.getElementById('leaflet-grayscale-style')) {
        const style       = document.createElement('style');
        style.id          = 'leaflet-grayscale-style';
        style.textContent = `
          .leaflet-tile-grayscale { filter: grayscale(1) contrast(1.1) brightness(0.95); }
        `;
        document.head.appendChild(style);
      }

      mapRef.current = map;

      // ── Círculos de calor por comunidad ───────────────────────────
      comunidades.forEach((com, idx) => {
        const coords = OAXACA_COORDS[idx % OAXACA_COORDS.length];
        const color  = irsuColor(com.irsuActual);

        // Capa de "calor" (blur grande, muy transparente)
        L.circleMarker(coords, {
          radius:      Math.max(30, Math.min(70, com.irsuActual / 2)),
          fillColor:   color,
          color:       'transparent',
          fillOpacity: 0.15,
          className:   'heat-blob',
        }).addTo(map);

        // Marcador principal (más pequeño y opaco)
        L.circleMarker(coords, {
          radius:      12,
          fillColor:   color,
          color:       '#ffffff',
          weight:      2,
          opacity:     1,
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:system-ui;min-width:160px">
              <p style="margin:0 0 4px;font-weight:700;font-size:14px;color:#0f1f0f">${com.nombre}</p>
              <p style="margin:0 0 2px;font-size:12px;color:#4a5e4a">${com.municipio.nombre}</p>
              <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
                <span style="font-size:20px;font-weight:800;color:${color}">${com.irsuActual.toFixed(1)}</span>
                <span style="font-size:10px;font-weight:700;color:${color};background:${color}18;padding:2px 8px;border-radius:99px">
                  ${irsuLabel(com.irsuActual)}
                </span>
              </div>
            </div>`,
            { maxWidth: 220 },
          );
      });

      // ── Leyenda ────────────────────────────────────────────────────
      const legend = (L.control as any)({ position: 'bottomleft' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', '');
        div.style.cssText = `
          background:rgba(255,255,255,0.92);
          border:1px solid #e8ede8;
          border-radius:8px;
          padding:10px 14px;
          font-family:system-ui;
          box-shadow:0 2px 8px rgba(0,0,0,.1);
        `;
        div.innerHTML = `
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#9aaa9a;letter-spacing:.05em">LEYENDA DE INTENSIDAD</p>
          ${[
            ['#dc2626', 'Riesgo Alto  (IRSU > 100)'],
            ['#d97706', 'Moderado     (50 – 100)'],
            ['#16a34a', 'Bajo         (< 50)'],
          ].map(([c, label]) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <div style="width:10px;height:10px;border-radius:50%;background:${c}"></div>
              <span style="font-size:12px;color:#4a5e4a">${label}</span>
            </div>
          `).join('')}
        `;
        return div;
      };
      legend.addTo(map);
    };

    // ── Carga diferida del script ──────────────────────────────────────
    if ((window as any).L) {
      initMap();
    } else {
      const script  = document.createElement('script');
      script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comunidades.length]);

  return React.createElement('div', {
    ref:   divRef,
    style: { width: '100%', height: '100%', minHeight: 400 },
  });
}