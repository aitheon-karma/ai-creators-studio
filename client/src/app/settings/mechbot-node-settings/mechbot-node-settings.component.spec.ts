import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MechbotNodeSettingsComponent } from './mechbot-node-settings.component';

describe('MechbotNodeSettingsComponent', () => {
  let component: MechbotNodeSettingsComponent;
  let fixture: ComponentFixture<MechbotNodeSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MechbotNodeSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MechbotNodeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
