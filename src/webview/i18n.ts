import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      'save': 'Save',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'close': 'Close',
      'settings': 'Settings',
      'success': 'Success',
      'error': 'Error',
      
      // HomePage
      'ui_framework_title': 'FiveM UI Framework',
      'ui_framework_subtitle': 'Complete UI solution for your FiveM resources',
      'interactive_demo': 'Interactive Demo',
      'demo_description': 'This boilerplate includes a complete UI system with menus, modals, forms, and notifications. Explore the different components and see how they can be used in your FiveM resource.',
      'character_menu': 'Character Menu',
      'character_menu_desc': 'Create and customize your character',
      'open_menu': 'Open Menu',
      'purchase_vehicle': 'Purchase Vehicle',
      'purchase_vehicle_desc': 'Preview and buy available vehicles',
      'show_details': 'Show Details',
      'server_settings': 'Server Settings',
      'server_settings_desc': 'Configure your gameplay preferences',
      'notifications': 'Notifications',
      'notifications_desc': 'Toast notifications for user feedback with customizable duration',
      'show_notification': 'Show Notification',
      'nui_events': 'NUI Events',
      'nui_events_desc': 'Seamless communication with client-side scripts',
      'send_test_event': 'Send Test Event',
      'version_info': 'Version 1.0.0 | Built with React, TypeScript & Tailwind CSS',
      'view_components': 'View Component Examples →',
      'dev_mode_toast': 'Running in development mode. NUI events will be simulated.',
      
      // Character Menu
      'player_info': 'Player Information',
      'character_info_desc': 'Enter your character details below.',
      'character_name': 'Character Name',
      'character_bio': 'Character Biography',
      'character_bio_placeholder': 'Tell us about your character\'s background...',
      'save_character': 'Save Character',
      'character_saved': 'Character information saved: {{name}}',
      'enter_character_name': 'Please enter a character name',
      
      // Vehicle Purchase
      'vehicle_purchase': 'Vehicle Purchase',
      'vehicle_preview': 'Vehicle Preview Image',
      'model': 'Model',
      'price': 'Price',
      'top_speed': 'Top Speed',
      'available': 'Available',
      'in_stock': '{{count}} in stock',
      'purchase_vehicle_button': 'Purchase Vehicle',
      
      // Server Settings
      'ui_theme': 'UI Theme',
      'hud_visibility': 'HUD Visibility',
      'settings_saved': 'Settings saved: {{message}}',
      'theme_set': 'Theme set to {{theme}}',
      'default_theme': 'Default theme',
      
      // Themes
      'theme_blue': 'Default Blue',
      'theme_emerald': 'Dark Emerald',
      'theme_purple': 'Vibrant Purple'
    }
  },
  es: {
    translation: {
      // Common
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'confirm': 'Confirmar',
      'close': 'Cerrar',
      'settings': 'Configuración',
      'success': 'Éxito',
      'error': 'Error',
      
      // HomePage
      'ui_framework_title': 'Framework UI de FiveM',
      'ui_framework_subtitle': 'Solución UI completa para tus recursos de FiveM',
      'interactive_demo': 'Demo Interactiva',
      'demo_description': 'Este modelo incluye un sistema UI completo con menús, modales, formularios y notificaciones. Explora los diferentes componentes y descubre cómo pueden usarse en tu recurso de FiveM.',
      'character_menu': 'Menú de Personaje',
      'character_menu_desc': 'Crea y personaliza tu personaje',
      'open_menu': 'Abrir Menú',
      'purchase_vehicle': 'Comprar Vehículo',
      'purchase_vehicle_desc': 'Previsualiza y compra vehículos disponibles',
      'show_details': 'Mostrar Detalles',
      'server_settings': 'Configuración del Servidor',
      'server_settings_desc': 'Configura tus preferencias de juego',
      'notifications': 'Notificaciones',
      'notifications_desc': 'Notificaciones toast para feedback del usuario con duración personalizable',
      'show_notification': 'Mostrar Notificación',
      'nui_events': 'Eventos NUI',
      'nui_events_desc': 'Comunicación fluida con scripts del lado del cliente',
      'send_test_event': 'Enviar Evento de Prueba',
      'version_info': 'Versión 1.0.0 | Creado con React, TypeScript y Tailwind CSS',
      'view_components': 'Ver Ejemplos de Componentes →',
      'dev_mode_toast': 'Ejecutando en modo desarrollo. Los eventos NUI serán simulados.',
      
      // Character Menu
      'player_info': 'Información del Jugador',
      'character_info_desc': 'Introduce los detalles de tu personaje a continuación.',
      'character_name': 'Nombre del Personaje',
      'character_bio': 'Biografía del Personaje',
      'character_bio_placeholder': 'Cuéntanos sobre el trasfondo de tu personaje...',
      'save_character': 'Guardar Personaje',
      'character_saved': 'Información del personaje guardada: {{name}}',
      'enter_character_name': 'Por favor, introduce un nombre para el personaje',
      
      // Vehicle Purchase
      'vehicle_purchase': 'Compra de Vehículo',
      'vehicle_preview': 'Vista previa del vehículo',
      'model': 'Modelo',
      'price': 'Precio',
      'top_speed': 'Velocidad Máxima',
      'available': 'Disponible',
      'in_stock': '{{count}} en stock',
      'purchase_vehicle_button': 'Comprar Vehículo',
      
      // Server Settings
      'ui_theme': 'Tema de UI',
      'hud_visibility': 'Visibilidad del HUD',
      'settings_saved': 'Configuración guardada: {{message}}',
      'theme_set': 'Tema cambiado a {{theme}}',
      'default_theme': 'Tema predeterminado',
      
      // Themes
      'theme_blue': 'Azul Predeterminado',
      'theme_emerald': 'Esmeralda Oscuro',
      'theme_purple': 'Púrpura Vibrante'
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disables suspense which can cause issues with FiveM
    }
  });

export default i18n;