import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/axios';
import { useAuthStore } from '@/src/store/auth.store';
import { useOaxacaComunidades, useOaxacaMunicipio } from '@/src/hooks/useOaxaca';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  verde:      '#1d4e32',
  verdeHover: '#edf7f0',
  verdeMid:   '#dcfce7',
  verdeText:  '#166534',
  bg:         '#f4f6f4',
  blanco:     '#ffffff',
  borde:      '#e8ede8',
  bordeLight: '#f0f4f0',
  texto:      '#0f1f0f',
  textoSub:   '#4a5e4a',
  textoMuted: '#9aaa9a',
  amber:      '#fef3c7', amberText: '#92400e', amberDot: '#d97706',
  azul:       '#dbeafe', azulText:  '#1e40af', azulDot:  '#3b82f6',
  rojo:       '#fee2e2', rojoText:  '#991b1b', rojoDot:  '#dc2626',
  morado:     '#f3e8ff', moradoText: '#6b21a8', moradoDot: '#9333ea',
};

const isWeb = Platform.OS === 'web';

type TabCuadrilla = 'cuadrillas' | 'asignaciones';
type EstadoAsignacion = 'ASIGNADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';

function estadoAsignacionCfg(e: EstadoAsignacion) {
  switch (e) {
    case 'ASIGNADA':   return { bg: C.amber,    text: C.amberText, dot: C.amberDot, label: 'Asignada'   };
    case 'EN_CURSO':   return { bg: C.azul,     text: C.azulText,  dot: C.azulDot,  label: 'En Curso'   };
    case 'COMPLETADA': return { bg: C.verdeMid, text: C.verdeText, dot: '#16a34a',  label: 'Completada' };
    case 'CANCELADA':  return { bg: C.rojo,     text: C.rojoText,  dot: C.rojoDot,  label: 'Cancelada'  };
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCuadrillas(municipioId?: number) {
  return useQuery({
    queryKey: ['cuadrillas', municipioId],
    queryFn: () => api.get('/cuadrillas', { params: { municipioId, limit: 100 } }).then(r => r.data),
  });
}

// FIX: si no hay municipioId en el store (SUPER_ADMIN), cargamos todas las cuadrillas activas
function useCuadrillasActivas(municipioId?: number) {
  return useQuery({
    queryKey: ['cuadrillas-sugeridas', municipioId],
    queryFn: () => {
      if (municipioId) {
        return api.get(`/cuadrillas/sugeridas/${municipioId}`).then(r => r.data);
      }
      // Sin municipioId: traer todas las cuadrillas activas y mapearlas al mismo shape
      return api.get('/cuadrillas', { params: { activa: true, limit: 100 } }).then(r => {
        const data = r.data?.data ?? r.data ?? [];
        return data.map((c: any) => ({
          ...c,
          asignacionesActivas: c._count?.asignaciones ?? 0,
        }));
      });
    },
  });
}

function useAsignaciones(filtros: { cuadrillaId?: number; estado?: string }) {
  return useQuery({
    queryKey: ['asignaciones', filtros],
    queryFn: () =>
      api.get('/cuadrillas/asignaciones/lista', { params: { ...filtros, limit: 100 } }).then(r => r.data),
  });
}

function useReportesPendientes() {
  return useQuery({
    queryKey: ['reportes-asignables'],
    queryFn: () =>
      api.get('/reportes', {
        params: { estado: 'PENDIENTE', limit: 50 },
      }).then(r => r.data),
  });
}

function useCrearCuadrilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => api.post('/cuadrillas', dto).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['cuadrillas'] }),
  });
}

function useActualizarCuadrilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) =>
      api.patch(`/cuadrillas/${id}`, dto).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuadrillas'] }),
  });
}

function useAsignarCuadrilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => api.post('/cuadrillas/asignaciones', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones'] });
      qc.invalidateQueries({ queryKey: ['cuadrillas-sugeridas'] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}

function useCambiarEstadoAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, nota }: { id: number; estado: string; nota?: string }) =>
      api.patch(`/cuadrillas/asignaciones/${id}/estado`, { estado, nota }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones'] });
      qc.invalidateQueries({ queryKey: ['cuadrillas-sugeridas'] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}

// ─── Chip estado asignación ───────────────────────────────────────────────────

function ChipAsignacion({ estado }: { estado: EstadoAsignacion }) {
  const c = estadoAsignacionCfg(estado);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99,
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>{c.label}</Text>
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: {
  label: string; value: number | string;
  color: string; icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  return (
    <View style={{
      flex: 1, minWidth: 130, backgroundColor: C.blanco,
      borderRadius: 10, borderWidth: 1, borderColor: C.borde,
      borderTopWidth: 3, borderTopColor: color, padding: 14,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Text>
        <MaterialIcons name={icon} size={18} color={color} style={{ opacity: 0.4 }} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '800', color: C.texto, letterSpacing: -1 }}>{value}</Text>
    </View>
  );
}

// ─── Formulario nueva cuadrilla ────────────────────────────────────────────────

function FormNuevaCuadrilla({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre]          = useState('');
  const [desc, setDesc]              = useState('');
  const [comunidadSel, setComunidad] = useState<any>(null);
  const { mutate, isPending }        = useCrearCuadrilla();

  const { data: comunidadesData, isLoading } = useOaxacaComunidades();
  const comunidades = comunidadesData ?? [];

  const handleCrear = () => {
    if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (!comunidadSel)  { Alert.alert('Error', 'Selecciona una comunidad'); return; }
    mutate(
      {
        nombre:      nombre.trim(),
        descripcion: desc.trim() || undefined,
        municipioId: comunidadSel.municipio.id,
      },
      {
        onSuccess: () => { setNombre(''); setDesc(''); setComunidad(null); onClose(); },
        onError:   (err: any) =>
          Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo crear'),
      }
    );
  };

  return (
    <View style={{
      backgroundColor: C.blanco, borderRadius: 12, padding: 18,
      borderWidth: 1, borderColor: C.borde, marginBottom: 14, gap: 10,
    }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.texto }}>Nueva Cuadrilla</Text>

      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginBottom: 4 }}>
          NOMBRE *
        </Text>
        <TextInput
          value={nombre} onChangeText={setNombre}
          placeholder="Ej: Cuadrilla Norte"
          placeholderTextColor={C.textoMuted}
          style={{
            borderWidth: 1, borderColor: C.borde, borderRadius: 8,
            padding: 10, fontSize: 14, color: C.texto, backgroundColor: '#f9fafb',
          }}
        />
      </View>

      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginBottom: 4 }}>
          DESCRIPCIÓN
        </Text>
        <TextInput
          value={desc} onChangeText={setDesc}
          placeholder="Zona que atiende (opcional)"
          placeholderTextColor={C.textoMuted}
          style={{
            borderWidth: 1, borderColor: C.borde, borderRadius: 8,
            padding: 10, fontSize: 14, color: C.texto, backgroundColor: '#f9fafb',
          }}
        />
      </View>

      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginBottom: 6 }}>
          COMUNIDAD *
        </Text>
        {isLoading && <ActivityIndicator color={C.verde} />}
        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
          {comunidades.map((c: any) => {
            const sel = comunidadSel?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id} onPress={() => setComunidad(c)}
                style={{
                  padding: 10, borderRadius: 8, marginBottom: 4,
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? C.verde : C.borde,
                  backgroundColor: sel ? C.verdeHover : C.blanco,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sel ? C.verde : C.textoMuted }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: sel ? '700' : '400', color: sel ? C.verde : C.texto }}>
                    {c.nombre}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textoMuted }}>{c.municipio.nombre}</Text>
                </View>
                {sel && <MaterialIcons name="check-circle" size={16} color={C.verde} />}
              </TouchableOpacity>
            );
          })}
          {!isLoading && comunidades.length === 0 && (
            <Text style={{ color: C.textoMuted, fontSize: 13, textAlign: 'center', padding: 12 }}>
              No hay comunidades activas disponibles
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TouchableOpacity
          onPress={onClose}
          style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: C.borde, alignItems: 'center' }}
        >
          <Text style={{ color: C.textoSub, fontWeight: '600' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCrear} disabled={isPending}
          style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: C.verde, alignItems: 'center' }}
        >
          {isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ color: '#fff', fontWeight: '700' }}>Crear</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Card cuadrilla ───────────────────────────────────────────────────────────

function CardCuadrilla({ cuadrilla }: { cuadrilla: any }) {
  const { mutate, isPending } = useActualizarCuadrilla();
  const activas = cuadrilla._count?.asignaciones ?? 0;
  const carga = activas === 0 ? '#16a34a' : activas < 3 ? C.amberDot : C.rojoDot;

  return (
    <View style={{
      backgroundColor: C.blanco, borderRadius: 8, borderWidth: 1, borderColor: C.borde,
      padding: 14, marginBottom: 6,
      borderLeftWidth: 3, borderLeftColor: cuadrilla.activa ? C.verde : C.textoMuted,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.texto }}>{cuadrilla.nombre}</Text>
          {cuadrilla.descripcion ? (
            <Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 2 }}>{cuadrilla.descripcion}</Text>
          ) : null}
          <Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 2 }}>
            {cuadrilla.municipio?.nombre}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: carga }}>{activas}</Text>
          <Text style={{ fontSize: 9, color: C.textoMuted, fontWeight: '600' }}>ACTIVAS</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              cuadrilla.activa ? 'Desactivar' : 'Activar',
              `¿${cuadrilla.activa ? 'Desactivar' : 'Activar'} "${cuadrilla.nombre}"?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: () => mutate({ id: cuadrilla.id, dto: { activa: !cuadrilla.activa } }) },
              ]
            )
          }
          disabled={isPending}
          style={{
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
            backgroundColor: cuadrilla.activa ? C.verdeMid : '#f1f5f9',
            borderWidth: 1, borderColor: cuadrilla.activa ? '#16a34a' : C.borde,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: cuadrilla.activa ? C.verdeText : C.textoMuted }}>
            {cuadrilla.activa ? '✓ Activa' : '— Inactiva'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Sección de asignación (inline, reemplaza al modal) ───────────────────────
// FIX: en lugar de un ScrollView anidado que causa problemas en web,
// mostramos esto como una sección expandible inline

function SeccionAsignar({ onClose, municipioId }: { onClose: () => void; municipioId?: number }) {
  const [cuadrillaId, setCuadrillaId] = useState<number | null>(null);
  const [reporteId, setReporteId]     = useState<number | null>(null);
  const [nota, setNota]               = useState('');

  // FIX: useCuadrillasActivas ahora funciona sin municipioId
  const { data: sugeridas, isLoading: loadCuadrillas } = useCuadrillasActivas(municipioId);
  const { data: reportesData, isLoading: loadReportes } = useReportesPendientes();
  const { mutate, isPending } = useAsignarCuadrilla();

  const reportes = (reportesData?.data ?? [])
    .sort((a: any, b: any) => b.gravedad - a.gravedad)
    .slice(0, 15);

  const cuadrillaSeleccionada = (sugeridas ?? []).find((c: any) => c.id === cuadrillaId);
  const reporteSeleccionado   = reportes.find((r: any) => r.id === reporteId);

  const handleAsignar = () => {
    if (!cuadrillaId || !reporteId) {
      Alert.alert('Error', 'Selecciona cuadrilla y reporte');
      return;
    }
    mutate(
      { cuadrillaId, reporteId, nota: nota.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert('✓', 'Cuadrilla asignada correctamente');
          onClose();
        },
        onError: (err: any) =>
          Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo asignar'),
      }
    );
  };

  return (
    <View style={{
      backgroundColor: C.blanco, borderRadius: 12, padding: 18,
      borderWidth: 1, borderColor: C.borde, marginBottom: 14, gap: 14,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.verde }}>Asignar Cuadrilla</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={22} color={C.textoMuted} />
        </TouchableOpacity>
      </View>

      {/* Resumen de selección */}
      {(cuadrillaId || reporteId) && (
        <View style={{
          backgroundColor: C.verdeHover, borderRadius: 8, padding: 10,
          borderWidth: 1, borderColor: '#b8e0c5', gap: 4,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
            SELECCIÓN ACTUAL
          </Text>
          <Text style={{ fontSize: 12, color: C.texto }}>
            Cuadrilla: {cuadrillaSeleccionada ? cuadrillaSeleccionada.nombre : '—'}
          </Text>
          <Text style={{ fontSize: 12, color: C.texto }}>
            Reporte: {reporteSeleccionado ? reporteSeleccionado.titulo : '—'}
          </Text>
        </View>
      )}

      {/* Cuadrillas */}
      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginBottom: 8 }}>
          CUADRILLA (ordenadas por disponibilidad)
        </Text>
        {loadCuadrillas && <ActivityIndicator color={C.verde} style={{ marginVertical: 8 }} />}
        {!loadCuadrillas && (sugeridas ?? []).length === 0 && (
          <View style={{
            backgroundColor: C.rojo, borderRadius: 8, padding: 10,
          }}>
            <Text style={{ fontSize: 12, color: C.rojoText, fontWeight: '600' }}>
              No hay cuadrillas activas. Activa al menos una cuadrilla primero.
            </Text>
          </View>
        )}
        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {(sugeridas ?? []).map((c: any) => {
            const seleccionada = cuadrillaId === c.id;
            const color = c.asignacionesActivas === 0 ? '#16a34a' : c.asignacionesActivas < 3 ? C.amberDot : C.rojoDot;
            return (
              <TouchableOpacity
                key={c.id} onPress={() => setCuadrillaId(c.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 10, borderRadius: 8, marginBottom: 4,
                  borderWidth: seleccionada ? 2 : 1,
                  borderColor: seleccionada ? C.verde : C.borde,
                  backgroundColor: seleccionada ? C.verdeHover : C.blanco,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.texto }}>{c.nombre}</Text>
                <Text style={{ fontSize: 11, color: C.textoMuted }}>{c.asignacionesActivas ?? 0} activas</Text>
                {seleccionada && <MaterialIcons name="check-circle" size={18} color={C.verde} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reportes pendientes */}
      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginBottom: 8 }}>
          REPORTE A ATENDER (ordenados por gravedad)
        </Text>
        {loadReportes && <ActivityIndicator color={C.verde} style={{ marginVertical: 8 }} />}
        {!loadReportes && reportes.length === 0 && (
          <View style={{ backgroundColor: C.amber, borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 12, color: C.amberText, fontWeight: '600' }}>
              No hay reportes pendientes sin asignación.
            </Text>
          </View>
        )}
        <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {reportes.map((r: any) => {
            const seleccionado = reporteId === r.id;
            return (
              <TouchableOpacity
                key={r.id} onPress={() => setReporteId(r.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 10, borderRadius: 8, marginBottom: 4,
                  borderWidth: seleccionado ? 2 : 1,
                  borderColor: seleccionado ? C.verde : C.borde,
                  backgroundColor: seleccionado ? C.verdeHover : C.blanco,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: r.gravedad >= 4 ? C.rojo : r.gravedad >= 3 ? C.amber : C.verdeMid,
                }}>
                  <Text style={{
                    fontSize: 12, fontWeight: '800',
                    color: r.gravedad >= 4 ? C.rojoText : r.gravedad >= 3 ? C.amberText : C.verdeText,
                  }}>
                    {r.gravedad}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.texto }} numberOfLines={1}>
                    {r.titulo}
                  </Text>
                  <Text style={{ fontSize: 10, color: C.textoMuted }}>{r.comunidad?.nombre}</Text>
                </View>
                {seleccionado && <MaterialIcons name="check-circle" size={18} color={C.verde} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Nota */}
      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginBottom: 4 }}>
          NOTA (opcional)
        </Text>
        <TextInput
          value={nota} onChangeText={setNota}
          placeholder="Instrucciones específicas para la cuadrilla..."
          placeholderTextColor={C.textoMuted}
          multiline numberOfLines={2}
          style={{
            borderWidth: 1, borderColor: C.borde, borderRadius: 8,
            padding: 10, fontSize: 13, color: C.texto, backgroundColor: '#f9fafb',
            minHeight: 60, textAlignVertical: 'top',
          }}
        />
      </View>

      {/* Botón confirmar */}
      <TouchableOpacity
        onPress={handleAsignar}
        disabled={isPending || !cuadrillaId || !reporteId}
        style={{
          padding: 14, borderRadius: 10, alignItems: 'center',
          backgroundColor: (!cuadrillaId || !reporteId) ? '#d1fae5' : C.verde,
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : (
          <Text style={{
            color: (!cuadrillaId || !reporteId) ? C.textoMuted : '#fff',
            fontWeight: '700', fontSize: 15,
          }}>
            Confirmar Asignación
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Fila asignación ─────────────────────────────────────────────────────────

function FilaAsignacion({ asignacion }: { asignacion: any }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCambiarEstadoAsignacion();

  const ESTADOS: EstadoAsignacion[] = ['ASIGNADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];

  return (
    <View style={{
      borderRadius: 8, borderWidth: 1,
      borderColor: open ? C.verde : C.borde,
      marginBottom: 6, backgroundColor: C.blanco, overflow: 'hidden',
    }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
      >
        <View style={{
          width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: asignacion.reporte.gravedad >= 4 ? '#fee2e2' : asignacion.reporte.gravedad >= 3 ? C.amber : C.verdeMid,
        }}>
          <Text style={{
            fontSize: 14, fontWeight: '800',
            color: asignacion.reporte.gravedad >= 4 ? C.rojoText : asignacion.reporte.gravedad >= 3 ? C.amberText : C.verdeText,
          }}>
            {asignacion.reporte.gravedad}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.texto }} numberOfLines={1}>
            {asignacion.reporte.titulo}
          </Text>
          <Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 1 }}>
            {asignacion.cuadrilla.nombre}  ·  {asignacion.reporte.comunidad?.nombre}
          </Text>
        </View>

        <ChipAsignacion estado={asignacion.estado} />
        <MaterialIcons
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={20} color={C.textoMuted}
        />
      </TouchableOpacity>

      {open && (
        <View style={{
          borderTopWidth: 1, borderTopColor: C.bordeLight,
          padding: 12, backgroundColor: '#fafcfa', gap: 10,
        }}>
          {asignacion.nota && (
            <View style={{ backgroundColor: C.amber, borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.amberText, marginBottom: 2 }}>NOTA</Text>
              <Text style={{ fontSize: 12, color: C.amberText }}>{asignacion.nota}</Text>
            </View>
          )}

          <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
            CAMBIAR ESTADO
          </Text>

          {isPending ? <ActivityIndicator color={C.verde} /> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ESTADOS.map(e => {
                const c = estadoAsignacionCfg(e);
                const activo = e === asignacion.estado;
                const deshabilitado =
                  asignacion.estado === 'COMPLETADA' ||
                  asignacion.estado === 'CANCELADA' ||
                  (asignacion.estado === 'ASIGNADA' && e === 'COMPLETADA');

                return (
                  <TouchableOpacity
                    key={e}
                    disabled={activo || deshabilitado}
                    onPress={() =>
                      Alert.alert('Confirmar', `¿Cambiar a "${c.label}"?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Confirmar', onPress: () => mutate({ id: asignacion.id, estado: e }) },
                      ])
                    }
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                      borderWidth: activo ? 2 : 1,
                      borderColor: activo ? c.dot : C.borde,
                      backgroundColor: activo ? c.bg : deshabilitado ? '#f9fafb' : C.blanco,
                      opacity: deshabilitado && !activo ? 0.4 : 1,
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? c.text : C.textoSub }}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── SeccionCuadrillas (principal) ────────────────────────────────────────────

export function SeccionCuadrillas() {
  const [tab, setTab]                       = useState<TabCuadrilla>('cuadrillas');
  const [mostrarForm, setMostrarForm]       = useState(false);
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [filtroEstado, setFiltroEstado]     = useState<string | undefined>(undefined);

  const usuario     = useAuthStore(s => s.usuario);
  // FIX: municipioId puede no existir en el store para SUPER_ADMIN — se pasa undefined
  const municipioId = (usuario as any)?.municipioId as number | undefined;

  const { data: cuadrillasData,   isLoading: loadCuadrillas   } = useCuadrillas(municipioId);
  const { data: asignacionesData, isLoading: loadAsignaciones } = useAsignaciones({ estado: filtroEstado });

  const cuadrillas   = cuadrillasData?.data   ?? [];
  const asignaciones = asignacionesData?.data ?? [];

  const activas      = cuadrillas.filter((c: any) =>  c.activa).length;
  const inactivas    = cuadrillas.filter((c: any) => !c.activa).length;
  const asignActivas = asignaciones.filter((a: any) =>
    a.estado === 'ASIGNADA' || a.estado === 'EN_CURSO'
  ).length;

  const TABS: { key: TabCuadrilla; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { key: 'cuadrillas',   label: 'Cuadrillas',   icon: 'engineering'          },
    { key: 'asignaciones', label: 'Asignaciones', icon: 'assignment-turned-in' },
  ];

  // FIX: filtros como chips horizontales con altura fija para web
  const FILTROS_ESTADO = [
    { label: 'Todas',      value: undefined      },
    { label: 'Asignada',   value: 'ASIGNADA'     },
    { label: 'En Curso',   value: 'EN_CURSO'     },
    { label: 'Completada', value: 'COMPLETADA'   },
    { label: 'Cancelada',  value: 'CANCELADA'    },
  ];

  return (
    <View style={{ flex: 1 }}>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard label="Cuadrillas Activas" value={activas}      color={C.verde}      icon="engineering"          />
        <StatCard label="Inactivas"          value={inactivas}    color={C.textoMuted} icon="do-not-disturb-on"    />
        <StatCard label="En Trabajo"         value={asignActivas} color={C.azulDot}    icon="assignment-turned-in" />
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row', backgroundColor: C.blanco, borderRadius: 10,
        borderWidth: 1, borderColor: C.borde, marginBottom: 16, padding: 4,
      }}>
        {TABS.map(t => {
          const activo = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => { setTab(t.key); setMostrarAsignar(false); setMostrarForm(false); }}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', gap: 6, paddingVertical: 8,
                borderRadius: 8, backgroundColor: activo ? C.verde : 'transparent',
              }}
            >
              <MaterialIcons name={t.icon} size={16} color={activo ? '#fff' : C.textoMuted} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: activo ? '#fff' : C.textoMuted }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Tab Cuadrillas ── */}
      {tab === 'cuadrillas' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setMostrarForm(!mostrarForm)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: 12, borderRadius: 10, marginBottom: 14,
              backgroundColor: mostrarForm ? C.rojoDot : C.verde,
            }}
          >
            <MaterialIcons name={mostrarForm ? 'close' : 'add'} size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              {mostrarForm ? 'Cancelar' : 'Nueva Cuadrilla'}
            </Text>
          </TouchableOpacity>

          {mostrarForm && <FormNuevaCuadrilla onClose={() => setMostrarForm(false)} />}

          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
            backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8,
            borderWidth: 1, borderColor: C.borde,
          }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
              CUADRILLA
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
              ASIG. ACTIVAS
            </Text>
          </View>

          {loadCuadrillas && <ActivityIndicator color={C.verde} style={{ marginTop: 20 }} />}

          {!loadCuadrillas && cuadrillas.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
              <MaterialIcons name="engineering" size={48} color={C.textoMuted} />
              <Text style={{ color: C.textoMuted }}>No hay cuadrillas registradas</Text>
            </View>
          )}

          {cuadrillas.map((c: any) => <CardCuadrilla key={c.id} cuadrilla={c} />)}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Tab Asignaciones ── */}
      {tab === 'asignaciones' && (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Botón asignar */}
          <TouchableOpacity
            onPress={() => setMostrarAsignar(!mostrarAsignar)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: 12, borderRadius: 10, marginBottom: 14,
              backgroundColor: mostrarAsignar ? C.rojoDot : C.verde,
            }}
          >
            <MaterialIcons name={mostrarAsignar ? 'close' : 'add-task'} size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              {mostrarAsignar ? 'Cancelar' : 'Asignar Cuadrilla'}
            </Text>
          </TouchableOpacity>

          {/* Sección asignar (inline, sin modal) */}
          {mostrarAsignar && (
            <SeccionAsignar
              onClose={() => setMostrarAsignar(false)}
              municipioId={municipioId}
            />
          )}

          {/* FIX: filtros como chips en fila flex-wrap — no ScrollView horizontal en web */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}>
            {FILTROS_ESTADO.map(f => {
              const activo = filtroEstado === f.value;
              return (
                <TouchableOpacity
                  key={String(f.value)}
                  onPress={() => setFiltroEstado(f.value)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99,
                    backgroundColor: activo ? C.verde : C.blanco,
                    borderWidth: 1, borderColor: activo ? C.verde : C.borde,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? '#fff' : C.textoSub }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Encabezado tabla */}
          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
            backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8,
            borderWidth: 1, borderColor: C.borde,
          }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
              REPORTE / CUADRILLA
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
              ESTADO
            </Text>
          </View>

          {loadAsignaciones && <ActivityIndicator color={C.verde} style={{ marginTop: 20 }} />}

          {!loadAsignaciones && asignaciones.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
              <MaterialIcons name="assignment-turned-in" size={48} color={C.textoMuted} />
              <Text style={{ color: C.textoMuted }}>No hay asignaciones</Text>
            </View>
          )}

          {asignaciones.map((a: any) => <FilaAsignacion key={a.id} asignacion={a} />)}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}