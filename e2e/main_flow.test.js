describe('IronLog Main Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should go through onboarding and login', async () => {
    // Onboarding
    await expect(element(by.text('Bem-vindo ao IronLog'))).toBeVisible();
    await element(by.id('onboarding-next-button')).tap();
    await element(by.id('onboarding-next-button')).tap();
    await element(by.id('onboarding-finish-button')).tap();

    // Login
    await element(by.id('login-email-input')).typeText('test@example.com');
    await element(by.id('login-password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();

    // Dashboard
    await expect(element(by.text('Início'))).toBeVisible();
  });

  it('should create and finish a workout', async () => {
    // Navegar para Treino
    await element(by.id('tab-workout')).tap();
    
    // Iniciar Treino
    await element(by.id('start-workout-button')).tap();
    
    // Adicionar Exercício
    await element(by.id('add-exercise-button')).tap();
    await element(by.text('Supino Reto')).tap();
    
    // Registrar Série
    await element(by.id('exercise-set-weight-0')).typeText('60');
    await element(by.id('exercise-set-reps-0')).typeText('10');
    await element(by.id('exercise-set-check-0')).tap();
    
    // Finalizar Treino
    await element(by.id('finish-workout-button')).tap();
    await expect(element(by.text('Treino Finalizado!'))).toBeVisible();
  });
});
