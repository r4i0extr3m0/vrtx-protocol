// Este arquivo mantém o nome esperado pelo runner Detox, mas agora valida um fluxo real do VRTX.
describe('VRTX Protocol smoke', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('shows the current brand on the first screen', async () => {
    await expect(element(by.text('VRTX Protocol'))).toBeVisible();
  });
});
