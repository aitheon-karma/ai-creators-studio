import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { PricingType, RobotType, LoginScreenType, AppStoreSettings } from '../../shared/models';
import { ToastrService } from 'ngx-toastr';
import { Project } from '@aitheon/creators-studio';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ai-mechbot-node-settings',
  templateUrl: './mechbot-node-settings.component.html',
  styleUrls: ['./mechbot-node-settings.component.scss']
})
export class MechbotNodeSettingsComponent implements OnInit, OnDestroy {

  @Input() currentProject: Project;
  @Output() currentProjectChange = new EventEmitter<Project>();
  @Input() submitted: boolean;

  private settingsFormChagnes$;
  settingsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  private buildForm() {
    this.settingsForm = this.fb.group({
      summary: [this.currentProject.summary, [Validators.required]],
    });

    this.settingsFormChagnes$ = this.settingsForm.valueChanges.subscribe(newValue => {
      const temp = {
        ...this.currentProject,
        ...newValue
      };
      this.currentProjectChange.emit(temp);
    });
  }

  ngOnInit() {
    this.buildForm();
  }

  ngOnDestroy() {
    this.settingsFormChagnes$.unsubscribe();
  }

}
