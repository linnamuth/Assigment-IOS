import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // ✅ Make sure this file exists and exports `routes`

bootstrapApplication(AppComponent, {
  providers: [
    // Use Ionic route reuse strategy
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Ionic Angular providers
    provideIonicAngular(),

    // Provide router with your standalone routes
    provideRouter(routes),

    // Import HttpClient globally
    importProvidersFrom(HttpClientModule)
  ]
}).catch(err => console.error(err));
