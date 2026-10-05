describe('VRTX Protocol main flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should finish the VRTX onboarding and reach authentication', async () => {
    await expect(element(by.text('Comece com clareza desde o primeiro toque.'))).toBeVisible();

    await element(by.id('onboarding-next-button')).tap();
    await element(by.id('onboarding-next-button')).tap();
    await element(by.id('onboarding-next-button')).tap();
    await element(by.id('onboarding-finish-button')).tap();

    await expect(element(by.id('login-email-input'))).toBeVisible();
    await expect(element(by.id('login-password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('should expose the offline visitor path from authentication', async () => {
    await element(by.text('Pular')).tap();
    await expect(element(by.label('Explorar como visitante'))).toBeVisible();
  });
});
