import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';
import { FileExtensionPipe } from './pipes/file-extension.pipe';
import { PrettyEnumPipe } from './pipes/pretty-enum.pipe';
import { EditDatePipe } from './pipes/edit-date.pipe';
import { SafeHtml } from './pipes/safeHtml.pipe';
import { ContentDeleteComponent } from './content-delete/content-delete.component';
import { GenericConfirmComponent } from './generic-confirm/generic-confirm.component';
import { NodePreviewComponent } from './components/node-preview/node-preview.component';
import { StoreRequestModalComponent } from './components/store-request-modal/store-request-modal.component';
import { TreeDropdownComponent } from './components/tree-dropdown/tree-dropdown.component';
import { BuildStatusPipe } from './pipes/build-status.pipe';
import { BuildStatusIconPipe } from './pipes/build-status-icon.pipe';
import { ProjectCardComponent } from './components/project-card/project-card.component';

@NgModule({
  declarations: [
    PrettyEnumPipe,
    EditDatePipe,
    BuildStatusPipe,
    BuildStatusIconPipe,
    FileExtensionPipe,
    SafeHtml,
    NodePreviewComponent,
    TreeDropdownComponent,
    StoreRequestModalComponent,
    ContentDeleteComponent,
    GenericConfirmComponent,
    ProjectCardComponent,
  ],
  imports: [
    ColorPickerModule,
    CoreClientModule,
    CommonModule,
  ],
    exports: [
        PrettyEnumPipe,
        EditDatePipe,
        BuildStatusPipe,
        BuildStatusIconPipe,
        SafeHtml,
        NodePreviewComponent,
        TreeDropdownComponent,
        StoreRequestModalComponent,
        ContentDeleteComponent,
        GenericConfirmComponent,
        ProjectCardComponent
    ]
})
export class SharedModule { }
