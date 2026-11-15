# Gestión de acceso — frontend

Módulo integrado con territorios en la rama `feature/territorios-mapa`. El diseño se desarrolló inicialmente en `sema-gestion-login`; esta es la versión integrada para entregar al equipo. Todavía no autentica usuarios ni crea cuentas.

## Pantallas

- `/login`: correo, contraseña, mostrar/ocultar, validación y enlaces a registro/recuperación.
- `/registro`: nombre, correo, contraseña y confirmación. El mínimo provisional es 8 caracteres; confirmar la política con backend. No incluye selección de roles.
- `/recuperar-contrasena`: solicitud por correo. No simula envío de mensajes ni confirma la existencia de usuarios.
- `/bienvenido`: bienvenida con navegación activa a Mi finca y Mapa. Los demás módulos aparecen como próximos y no presentan resultados simulados.

La ruta `/` abre el acceso en esta entrega. Cuando se integre la portada del compañero, su botón Comenzar debe enlazar a `/login`, conservando su página en `/`. Bienvenida, Mi finca y Mapa requieren un estado de sesión en memoria; sin él redirigen al acceso. La única sesión habilitada actualmente es la demostración explícita.

## Revisar la demostración

1. Ejecutar `npm.cmd run dev` y abrir `/login`.
2. Comprobar los mensajes de campos vacíos/correo inválido, los botones para mostrar claves y los enlaces de los tres formularios.
3. Pulsar **Explorar demostración**, sin correo ni contraseña, para revisar `/bienvenido`.
4. Navegar a Mi finca, seleccionar una ubicación y continuar al mapa para dibujar el terreno. Los enlaces de bienvenida permiten volver al panel sin perder el borrador.
5. Salir desde el perfil, el aviso de demostración o la cabecera de territorios. La memoria de sesión y del terreno se limpia; volver a rutas internas redirige al acceso. Al recargar también se pierde el estado temporal.

Los formularios válidos indican que el servicio no está habilitado. No se envían, registran ni persisten contraseñas. La demostración no crea un JWT ni representa una autenticación exitosa. La sesión de demostración vive solo en memoria y desaparece al recargar. La navegación restringida en React es presentación, no una barrera de seguridad para servicios del backend.

`SesionAcceso` y `UsuarioSesion` reservan roles y permisos que deberá proporcionar backend; la demostración utiliza listas vacías. El servidor tendrá que comprobar las autorizaciones de cada recurso. No se decodifican tokens ficticios ni se guardan tokens en localStorage/sessionStorage.

## Información pendiente del equipo

1. URL del backend, rutas y métodos de inicio de sesión, registro, recuperación y cierre de sesión.
2. Campos obligatorios de registro y política definitiva de contraseñas.
3. Ejemplos JSON de éxito, validación, credenciales inválidas, correo duplicado, límites de solicitudes y errores de servicio.
4. Entrega y transporte del JWT: cookies o cabecera Authorization, expiración, renovación e invalidación al salir; configuración CORS si frontend y backend tienen orígenes distintos.
5. Identificadores de roles, formato de permisos y pantallas/acciones correspondientes a cada uno.
6. Recuperación: formato y duración del enlace, destino del usuario y endpoint de nueva contraseña. La pantalla de este alcance solo solicita la recuperación, no cambia la clave.
7. Confirmar el responsable de la bienvenida definitiva y entregar logos/recursos de marca oficiales para sustituir los provisionales.

Nunca compartir claves de firma JWT, contraseñas de base de datos ni credenciales de servicio para integrar React. La configuración pública del backend se acordará con el equipo.

## Diseño y recursos

Los estilos de acceso están limitados a prefijos `ac-` y `bv-`. App.tsx coordina el estado de sesión y del terreno, junto con sus rutas. Los componentes compartidos de layout incluyen bienvenida y salida de la demostración. Territorios se carga de forma diferida para no descargar el mapa al abrir el login. No se reemplazaron sus formularios, servicios geográficos ni herramientas de dibujo.

- Paisaje provisional: https://images.unsplash.com/photo-1500382017468-9049fed747ef
- Tierra decorativa: https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4
- Identificador NASA de la referencia: https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg
- La marca SEMA se representa provisionalmente con SVG y texto; reemplazar por el archivo del equipo.

Las imágenes se incluyen localmente para evitar solicitudes externas al abrir los formularios. No representan el terreno seleccionado por el usuario ni datos actuales.
