import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MechbotSettingsComponent } from './mechbot-settings.component';

describe('MechbotSettingsComponent', () => {
  let component: MechbotSettingsComponent;
  let fixture: ComponentFixture<MechbotSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MechbotSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MechbotSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
