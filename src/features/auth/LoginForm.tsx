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
import { loginSchema, LoginInput } from './auth.schema';
import { useLogin } from './auth.queries';

export function LoginForm() {
  const { mutate: iniciarSesion, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => iniciarSesion(data);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
          backgroundColor: '#f8f9ff',
        }}
      >
        {/* Brand Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: '#1d4e32',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 32 }}>🏛️</Text>
          </View>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '700',
              color: '#0b1c30',
              letterSpacing: -0.6,
            }}
          >
            IRSU
          </Text>
          <Text style={{ fontSize: 16, color: '#434655', marginTop: 4 }}>
            Portal Ciudadano
          </Text>
        </View>

        {/* Card */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 24,
            borderWidth: 1,
            borderColor: '#c3c6d7',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {/* Email */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#0b1c30',
              marginBottom: 4,
              letterSpacing: 0.1,
            }}
          >
            Correo electrónico
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
                placeholderTextColor="#737686"
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: errors.email ? '#ba1a1a' : '#737686',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: '#0b1c30',
                  backgroundColor: '#fff',
                  marginBottom: 4,
                }}
              />
            )}
          />
          {errors.email && (
            <Text style={{ color: '#ba1a1a', fontSize: 12, marginBottom: 8 }}>
              {errors.email.message}
            </Text>
          )}

          {/* Password */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#0b1c30',
              marginBottom: 4,
              marginTop: 16,
              letterSpacing: 0.1,
            }}
          >
            Contraseña
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                secureTextEntry
                placeholderTextColor="#737686"
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: errors.password ? '#ba1a1a' : '#737686',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: '#0b1c30',
                  backgroundColor: '#fff',
                  marginBottom: 4,
                }}
              />
            )}
          />
          {errors.password && (
            <Text style={{ color: '#ba1a1a', fontSize: 12, marginBottom: 8 }}>
              {errors.password.message}
            </Text>
          )}

          {/* Error servidor */}
          {error && (
            <View
              style={{
                backgroundColor: '#ffdad6',
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#93000a', fontSize: 14, textAlign: 'center' }}>
                Credenciales inválidas
              </Text>
            </View>
          )}

          {/* Botón */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            style={{
              height: 52,
              backgroundColor: isPending ? '#86efac' : '#1d4e32',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
              flexDirection: 'row',
              gap: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#c3c6d7' }} />
            <Text style={{ color: '#737686', fontSize: 12, marginHorizontal: 12 }}>
              O CONTINÚA SIN CUENTA
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#c3c6d7' }} />
          </View>

          {/* Botón anónimo */}
          <Link href="/(main)/reportes" asChild>
            <TouchableOpacity
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: '#c3c6d7',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>👤</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30' }}>
                Continuar como invitado
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Link registro */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 32,
          }}
        >
          <Text style={{ color: '#434655', fontSize: 16 }}>
            ¿Nuevo en la comunidad?{' '}
          </Text>
          <Link href="/auth/registro">
            <Text style={{ color: '#1d4e32', fontSize: 18, fontWeight: '600' }}>
              Regístrate
            </Text>
          </Link>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 32, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text style={{ color: '#737686', fontSize: 12 }}>Privacidad</Text>
            <Text style={{ color: '#737686', fontSize: 12 }}>Términos</Text>
          </View>
          <Text style={{ color: '#c3c6d7', fontSize: 12, textAlign: 'center' }}>
            Servicio Ciudadano Oficial — Autoridad IRSU
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}