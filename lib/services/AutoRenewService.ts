/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */


import { TokenManager, EVENT_EXPIRED } from '../TokenManager';
import { AuthSdkError } from '../errors';
import { ServiceInterface, ServiceManagerOptions } from '../types';
import { isBrowser } from '../features';

export class AutoRenewService implements ServiceInterface {
  private tokenManager: TokenManager;
  private options: ServiceManagerOptions;
  private renewTimeQueue: Array<number>;
  private started = false;

  constructor(tokenManager: TokenManager, options: ServiceManagerOptions = {}) {
    this.tokenManager = tokenManager;
    this.options = options;
    this.renewTimeQueue = [];
    this.onTokenExpiredHandler = this.onTokenExpiredHandler.bind(this);
  }
  
  private shouldThrottleRenew(): boolean {
    let res = false;
    this.renewTimeQueue.push(Date.now());
    if (this.renewTimeQueue.length >= 10) {
      // get and remove first item from queue
      const firstTime = this.renewTimeQueue.shift() as number;
      const lastTime = this.renewTimeQueue[this.renewTimeQueue.length - 1];
      res = (lastTime - firstTime) < 30 * 1000;
    }
    return res;
  }

  requiresLeadership() {
    // If tokens sync storage is enabled, handle tokens expiration only in 1 leader tab
    return !!this.options.syncStorage && isBrowser();
  }

  private onTokenExpiredHandler(key: string) {
    if (this.options.autoRenew) {
      if (this.shouldThrottleRenew()) {
        const error = new AuthSdkError('Too many token renew requests');
        this.tokenManager.emitError(error);
      } else {
        this.tokenManager.renew(key).catch(() => {}); // Renew errors will emit an "error" event 
      }
    } else if (this.options.autoRemove) {
      this.tokenManager.remove(key);
    }
  }

  canStart() {
    return (!!this.options.autoRenew || !!this.options.autoRemove);
  }

  start() {
    if (this.canStart()) {
      this.stop();
      this.tokenManager.on(EVENT_EXPIRED, this.onTokenExpiredHandler);
      this.started = true;
    }
  }

  stop() {
    if (this.started) {
      this.tokenManager.off(EVENT_EXPIRED, this.onTokenExpiredHandler);
      this.renewTimeQueue = [];
      this.started = false;
    }
  }

  isStarted() {
    return this.started;
  }
}
