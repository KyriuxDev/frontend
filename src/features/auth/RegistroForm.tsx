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
import { registroSchema, RegistroInput } from './auth.schema';
import { useRegistro } from './auth.queries';

export function RegistroForm() {
  const { mutate: registrarse, isPending, error } = useRegistro();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
  });

  const onSubmit = (data: RegistroInput) => registrarse(data);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: '#f8f9ff',
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 52,
            paddingBottom: 12,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#2563eb', letterSpacing: -0.5 }}>
              IRSU
            </Text>
          </View>
          <Link href="/auth/login">
            <Text style={{ fontSize: 22, color: '#64748b' }}>✕</Text>
          </Link>
        </View>

        <View style={{ padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' }}>

          {/* Título */}
          <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 12 }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: '700',
                color: '#0b1c30',
                letterSpacing: -0.6,
                marginBottom: 8,
              }}
            >
              Crear cuenta
            </Text>
            <Text style={{ fontSize: 16, color: '#434655', textAlign: 'center' }}>
              Únete a la comunidad y ayúdanos a mantener una mejor ciudad para todos.
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
              gap: 16,
            }}
          >
            {/* Nombre */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30', marginBottom: 4 }}>
                Nombre{' '}
                <Text style={{ fontWeight: '400', color: '#737686' }}>(Opcional)</Text>
              </Text>
              <Controller
                control={control}
                name="nombre"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    onChangeText={onChange}
                    value={value}
                    placeholder="Tu nombre completo"
                    placeholderTextColor="#737686"
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: errors.nombre ? '#ba1a1a' : '#c3c6d7',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      fontSize: 16,
                      color: '#0b1c30',
                      backgroundColor: '#fff',
                    }}
                  />
                )}
              />
              {errors.nombre && (
                <Text style={{ color: '#ba1a1a', fontSize: 12, marginTop: 4 }}>
                  {errors.nombre.message}
                </Text>
              )}
            </View>

            {/* Email */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30', marginBottom: 4 }}>
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
                      borderColor: errors.email ? '#ba1a1a' : '#c3c6d7',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      fontSize: 16,
                      color: '#0b1c30',
                      backgroundColor: '#fff',
                    }}
                  />
                )}
              />
              {errors.email && (
                <Text style={{ color: '#ba1a1a', fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30', marginBottom: 4 }}>
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
                    placeholderTextColor="#737686"
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: errors.password ? '#ba1a1a' : '#c3c6d7',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      fontSize: 16,
                      color: '#0b1c30',
                      backgroundColor: '#fff',
                    }}
                  />
                )}
              />
              {errors.password && (
                <Text style={{ color: '#ba1a1a', fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Error servidor */}
            {error && (
              <View
                style={{
                  backgroundColor: '#ffdad6',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text style={{ color: '#93000a', fontSize: 14, textAlign: 'center' }}>
                  Error al crear la cuenta. Intenta con otro email.
                </Text>
              </View>
            )}

            {/* Botón */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              style={{
                height: 52,
                backgroundColor: isPending ? '#b4c5ff' : '#2563eb',
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 8,
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Crear cuenta →
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#c3c6d7' }} />
            <Text style={{ color: '#737686', fontSize: 12 }}>O CONTINÚA SIN CUENTA</Text>
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

          {/* Link login */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#434655', fontSize: 16 }}>¿Ya tienes cuenta? </Text>
            <Link href="/auth/login">
              <Text style={{ color: '#004ac6', fontSize: 16, fontWeight: '700' }}>
                Inicia sesión
              </Text>
            </Link>
          </View>

          {/* Footer */}
          <Text
            style={{
              color: '#737686',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 32,
              paddingHorizontal: 16,
            }}
          >
            Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}