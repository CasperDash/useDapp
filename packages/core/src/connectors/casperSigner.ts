import { JsonTypes } from 'typedjson';

import { ConnectorNotFoundError } from '../errors';
import { CasperLabsHelper } from '../types/casperLabsHelper';
import { Deploy } from '../types/deploy';

import { Connector } from './base';

type CasperLabWindowGlobal = CasperLabsHelper;
type Provider = CasperLabsHelper;
type EventProvider = Window;

export type CasperSignerConnectorOptions = {
  name?: string;
  getProvider?: () => Provider | undefined;
  getEventProvider?: () => EventProvider;
};

export class CasperSignerConnector extends Connector<
CasperLabWindowGlobal,
Window,
CasperSignerConnectorOptions
> {
  public readonly id: string = 'casperSigner';

  private provider: Provider | undefined;
  private eventProvider: Window | undefined;

  constructor({
    options: defaultOptions,
  }: { options?: CasperSignerConnectorOptions } = {}) {
    const options = {
      name: 'CasperSigner',
      getProvider: (): Provider | undefined => {
        return typeof window !== 'undefined'
          ? window.casperlabsHelper
          : undefined;
      },
      getEventProvider: (): EventProvider => {
        return window;
      },
      ...defaultOptions,
    };

    super({ options });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getProvider(): Promise<CasperLabWindowGlobal> {
    const provider = this.options.getProvider?.();
    if (!provider) {
      throw new ConnectorNotFoundError();
    }
    this.provider = provider;

    return this.provider;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getEventProvider(): Promise<EventProvider> {
    const eventProvider = this.options.getEventProvider?.();
    if (!eventProvider) {
      throw new ConnectorNotFoundError();
    }

    this.eventProvider = eventProvider;

    return this.eventProvider;
  }

  public async isConnected(): Promise<boolean> {
    try {
      const provider = await this.getProvider();

      return await provider.isConnected();
    } catch (err) {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    const provider = await this.getProvider();

    const eventProvider = await this.getEventProvider();

    eventProvider?.removeEventListener(
      'signer:activeKeyChanged',
      this.onActiveKeyChanged,
    );
    eventProvider?.removeEventListener(
      'signer:disconnected',
      this.onDisconnected,
    );
    eventProvider?.removeEventListener('signer:connected', this.onConnected);

    provider.disconnectFromSite();
  }

  public async connect(): Promise<void> {
    const provider = await this.getProvider();

    const eventProvider = await this.getEventProvider();

    eventProvider?.addEventListener(
      'signer:activeKeyChanged',
      this.onActiveKeyChanged,
    );
    eventProvider?.addEventListener('signer:disconnected', this.onDisconnected);
    eventProvider?.addEventListener('signer:connected', this.onConnected);

    provider.requestConnection();
  }

  public async getActivePublicKey(): Promise<string> {
    const provider = await this.getProvider();

    return provider.getActivePublicKey();
  }

  public async signMessage(
    message: string,
    signingPublicKeyHex: string,
  ): Promise<string> {
    const provider = await this.getProvider();

    return provider.signMessage(message, signingPublicKeyHex);
  }

  public async sign(
    deploy: { deploy: JsonTypes },
    signingPublicKeyHex: string,
    targetPublicKeyHex: string,
  ): Promise<Deploy> {
    const provider = await this.getProvider();

    return provider.sign(deploy, signingPublicKeyHex, targetPublicKeyHex);
  }

  public onDisconnected(): void {
    const customEvent = new CustomEvent('casper:disconnect');
    window.dispatchEvent(customEvent);
    // this.emit('disconnect');
  }

  public onActiveKeyChanged(
    event: CustomEventInit<{ activeKey: string; isConnected: boolean }>,
  ): void {
    const customEvent = new CustomEvent('casper:change', event);
    window.dispatchEvent(customEvent);
    // this.emit('change', { isConnected: event.detail?.isConnected, activeKey: event.detail?.activeKey });
  }

  public onConnected(
    event: CustomEventInit<{ activeKey: string; isConnected: boolean }>,
  ): void {
    const customEvent = new CustomEvent('casper:connect', event);
    window.dispatchEvent(customEvent);
    // this.emit('connect', { isConnected: event.detail?.isConnected, activeKey: event.detail?.activeKey });
  }
}
