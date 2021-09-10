import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CreatorsStudioModule, Configuration, ConfigurationParameters } from '@aitheon/creators-studio';
import { RepositoriesModule } from './repositories/repositories.module';
import { SandboxesModule } from './sandboxes/sandboxes.module';
import { ItemManagerModule } from '@aitheon/item-manager';
import { TemplateModule as PlatformSupportModule } from '@aitheon/platform-support';
import { ContextMenuModule } from 'ngx-contextmenu';
import { AdminModule } from './admin/admin.module';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SystemGraphModule } from '@aitheon/system-graph';
import { MarketplaceModule } from '@aitheon/marketplace';

export function apiConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath: '.'
  };
  return new Configuration(params);
}

export function apiItemManagerConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath:  environment.baseApi + '/item-manager',
  };
  return new Configuration(params);
}

export function apiPlatformSupportConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath:  environment.baseApi + '/platform-support',
  };
  return new Configuration(params);
}

export function apiSystemGraphConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath:  environment.baseApi + '/system-graph',
  };
  return new Configuration(params);
}

export function apiMarketplaceConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath:  environment.baseApi + '/marketplace',
  };
  return new Configuration(params);
}


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CoreClientModule.forRoot({
      baseApi: environment.baseApi,
      production: environment.production
    }),
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    DashboardModule,
    RepositoriesModule,
    SandboxesModule,
    AdminModule,
    TabsModule.forRoot(),
    ContextMenuModule.forRoot({
      useBootstrap4: true,
      autoFocus: true
    }),
    CreatorsStudioModule.forRoot(apiConfigFactory),
    ItemManagerModule.forRoot(apiItemManagerConfigFactory),
    PlatformSupportModule.forRoot(apiPlatformSupportConfigFactory),
    SystemGraphModule.forRoot(apiSystemGraphConfigFactory),
    MarketplaceModule.forRoot(apiMarketplaceConfigFactory),

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
