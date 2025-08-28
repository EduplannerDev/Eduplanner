/**
 * Utilidad para limpiar manualmente el estado de autenticación
 * 
 * Para usar este script:
 * 1. Abre las herramientas de desarrollador (F12)
 * 2. Ve a la pestaña "Console"
 * 3. Copia y pega este código completo
 * 4. Presiona Enter
 * 
 * Esto limpiará completamente tu estado de autenticación y te redirigirá al login.
 */

(function clearAuthenticationState() {
  console.log('🔧 Iniciando limpieza de estado de autenticación...');
  
  try {
    // Limpiar localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
        console.log(`✅ Eliminado de localStorage: ${key}`);
      }
    });
    
    // Limpiar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
        console.log(`✅ Eliminado de sessionStorage: ${key}`);
      }
    });
    
    // Limpiar cookies relacionadas con autenticación
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Estado de autenticación limpiado completamente');
    console.log('🔄 Redirigiendo al login...');
    
    // Redirigir al login después de un breve delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    console.log('🔄 Intentando recargar la página...');
    window.location.reload();
  }
})();