import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';

import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { firebaseConfig } from './environments/firebase';
import { provideServiceWorker } from '@angular/service-worker';
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),  provideHttpClient(), provideFirebaseApp(() => initializeApp(firebaseConfig)), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),]
};
