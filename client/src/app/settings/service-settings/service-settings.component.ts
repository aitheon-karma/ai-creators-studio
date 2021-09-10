import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PricingType, RobotType, LoginScreenType, AppStoreSettings, Settings } from '../../shared/models';
import { Project } from '@aitheon/creators-studio';
import { NgForm } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ai-service-settings',
  templateUrl: './service-settings.component.html',
  styleUrls: ['./service-settings.component.scss']
})
export class ServiceSettingsComponent implements OnInit, OnDestroy {

  @Input() currentProject: Project;
  @Output() currentProjectChange = new EventEmitter<Project>();
  @Input() submitted: boolean;

  loginScreenType = LoginScreenType;

  private settingsFormChagnes$;
  settingsForm: FormGroup;
  screenTypes = [
    {
      id: LoginScreenType.SCREEN_TYPE_1,
      name: 'Screen Type 1'
    },
    {
      id: LoginScreenType.SCREEN_TYPE_2,
      name: 'Screen Type 2'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  private buildForm() {
    this.settingsForm = this.fb.group({
      summary: [this.currentProject.summary, [Validators.required]],
      settings: this.fb.group({
        // hideUserHeader: [this.currentProject.settings && this.currentProject.settings.hideUserHeader, []],
        // userLoginRequired: [this.currentProject.settings && this.currentProject.settings.userLoginRequired, []],
        // loginScreenType: [this.currentProject.settings && this.currentProject.settings.loginScreenType, []],
        hideUserHeader: ['', []],
        userLoginRequired: ['', []],
        loginScreenType: ['', []],
      }),
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
