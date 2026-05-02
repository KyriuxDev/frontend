import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { loginSchema, LoginInput } from '@/src/features/auth/auth.schema';
import { useLogin } from '@/src/features/auth/auth.queries';

export default function LoginScreen() {
  const { mutate: iniciarSesion, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    iniciarSesion(data);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>

        {/* Título */}
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>
          IRSU
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
          Inicia sesión para continuar
        </Text>

        {/* Email */}
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>Email</Text>
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
              placeholder="Tu contraseña"
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
            Credenciales inválidas
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
              Iniciar sesión
            </Text>
          )}
        </TouchableOpacity>

        {/* Link a registro */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: '#6b7280' }}>¿No tienes cuenta? </Text>
          <Link href="/auth/registro">
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Regístrate</Text>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}