import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { registroSchema, RegistroInput } from '@/src/features/auth/auth.schema';
import { useRegistro } from '@/src/features/auth/auth.queries';

export default function RegistroScreen() {
  const { mutate: registrarse, isPending, error } = useRegistro();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
  });

  const onSubmit = (data: RegistroInput) => {
    registrarse(data);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}
      >
        {/* Título */}
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>
          Crear cuenta
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
          Regístrate para reportar incidencias
        </Text>

        {/* Nombre */}
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
          Nombre (opcional)
        </Text>
        <Controller
          control={control}
          name="nombre"
          render={({ field: { onChange, value } }) => (
            <TextInput
              onChangeText={onChange}
              value={value}
              placeholder="Tu nombre"
              style={{
                borderWidth: 1,
                borderColor: errors.nombre ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                marginBottom: 4,
                fontSize: 16,
              }}
            />
          )}
        />
        {errors.nombre && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
            {errors.nombre.message}
          </Text>
        )}

        {/* Email */}
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, marginTop: 8 }}>
          Email
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              onChangeText={onChange}
              value={value}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: errors.email ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                marginBottom: 4,
                fontSize: 16,
              }}
            />
          )}
        />
        {errors.email && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
            {errors.email.message}
          </Text>
        )}

        {/* Password */}
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, marginTop: 8 }}>
          Contraseña
        </Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              onChangeText={onChange}
              value={value}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: errors.password ? '#ef4444' : '#d1d5db',
                borderRadius: 8,
                padding: 12,
                marginBottom: 4,
                fontSize: 16,
              }}
            />
          )}
        />
        {errors.password && (
          <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
            {errors.password.message}
          </Text>
        )}

        {/* Error del servidor */}
        {error && (
          <Text style={{ color: '#ef4444', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
            Error al crear la cuenta. Intenta con otro email.
          </Text>
        )}

        {/* Botón */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
          style={{
            backgroundColor: isPending ? '#93c5fd' : '#2563eb',
            padding: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              Crear cuenta
            </Text>
          )}
        </TouchableOpacity>

        {/* Link a login */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: '#6b7280' }}>¿Ya tienes cuenta? </Text>
          <Link href="/auth/login">
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Inicia sesión</Text>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}