import { Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventInput,
  EventSourceInput,
} from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FileUploadEvent, FileUploadModule } from 'primeng/fileupload';
import { FileUpload } from 'primeng/fileupload';
@Component({
  selector: 'app-root',
  imports: [
    FullCalendarModule,
    InputTextModule,
    FloatLabel,
    ButtonModule,
    InputNumberModule,
    ConfirmDialogModule,
    FormsModule,
    ReactiveFormsModule,
    SelectButtonModule,
    FileUploadModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [ConfirmationService],
})
export class AppComponent {
  constructor(private confirmationService: ConfirmationService) {
    this.holidayTaken = JSON.parse(
      localStorage.getItem('settedHolidays') ?? '[]'
    );

    const savedSettings = localStorage.getItem('settings')
      ? JSON.parse(localStorage.getItem('settings')!)
      : {
          name: '',
          holiday: undefined,
          previousHoliday: undefined,
          rou: undefined,
        };
    this.settingsFormGroup = new FormGroup({
      name: new FormControl(savedSettings.name ?? '', [
        Validators.required,
        Validators.minLength(1),
      ]),
      holiday: new FormControl<number | undefined>(
        savedSettings.holiday ?? undefined,
        [Validators.required]
      ),
      previousHoliday: new FormControl<number | undefined>(
        savedSettings.previousHoliday ?? undefined,
        [Validators.required]
      ),
      rou: new FormControl<number | undefined>(savedSettings.rou ?? undefined, [
        Validators.required,
      ]),
      showWeekends: new FormControl<boolean | null>(
        savedSettings.showWeekends ?? null
      ),
    });
    this.settingsFormGroup.get('showWeekends')?.valueChanges.subscribe((it) => {
      this.calendarOptions.weekends = it ?? false;
    });

    console.log(window.screen.width);

    this.calendarOptions = {
      initialView:
        window.screen.width >= 1000 ? 'multiMonthYear' : 'dayGridMonth',
      multiMonthMaxColumns: 4,
      selectable: true,
      eventClick: (eventClick) => {
        if (eventClick.event.start) this.handleEvent(eventClick.event.start);
      },
      dateClick: (dateClick) => {
        this.handleEvent(dateClick.date);
      },
      dayCellClassNames: 'text-black bg-white',
      plugins: [dayGridPlugin, multiMonthPlugin, interactionPlugin],
      contentHeight: 900,
      weekends: this.settingsFormGroup.get('showWeekends')!.value,
    };
  }

  title = 'holiday-planner';

  settingsFormGroup: FormGroup;
  isRemoval = false;
  stateOptions: any[] = [{ label: 'Show weekends', value: true }];

  holidayTaken: EventInput[];

  calendarOptions: CalendarOptions;

  calculateLeftHolidays() {
    let leftHolidays: number =
      (this.settingsFormGroup.get('holiday')?.value ?? 0) +
      (this.settingsFormGroup.get('previousHoliday')?.value ?? 0);
    const rou = this.settingsFormGroup.get('rou')?.value ?? 0;
    return leftHolidays + Math.floor(rou / 8) - this.holidayTaken.length;
  }

  calculateLeftHours() {
    const rou = this.settingsFormGroup.get('rou')?.value ?? 0;
    return rou % 8;
  }

  reset() {
    this.holidayTaken = [];
  }

  onGenerateClick(event: Event) {
    if (this.settingsFormGroup.invalid) return;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Would you save this preset locally ?',
      header: 'Save settings',
      closable: true,
      closeOnEscape: true,

      icon: 'pi pi-address-book',
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Save',
      },
      accept: () => {
        localStorage.setItem(
          'settedHolidays',
          JSON.stringify(this.holidayTaken)
        );
        localStorage.setItem(
          'settings',
          JSON.stringify(this.settingsFormGroup.value)
        );

        this.generateSavingFile();
      },
      reject: () => {
        this.generateSavingFile();
      },
    });
  }

  async generateSavingFile() {
    const saving = {
      settings: this.settingsFormGroup.value,
      holidayTaken: this.holidayTaken,
    };

    const blob = new Blob([JSON.stringify(saving)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'holiday-planner-' + new Date().toLocaleDateString() + '.json';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  handleEvent(eventDate: Date) {
    const date = this.holidayTaken.findIndex((it) => {
      return it.start?.toLocaleString() == eventDate.toLocaleString();
    });
    console.log(eventDate.toLocaleString());
    console.log(this.holidayTaken);
    if (date != -1) this.holidayTaken.splice(date, 1);
    else
      this.holidayTaken = [
        ...this.holidayTaken,
        {
          start: eventDate,
          end: eventDate,
          title: 'Holiday',
          id: '',
          groupId: '',
          allDay: true,
          className: 'holiday',
          backgroundColor: 'rgb(52, 211, 153)',
          textColor: '#18181B',
          borderColor: 'rgb(52, 211, 153)',
        },
      ];
  }
  setSettings(saving: any) {
    this.settingsFormGroup.setValue(saving.settings);
    this.holidayTaken = saving.holidayTaken;
    console.log(saving);
  }

  onUpload(fileEvent: HTMLInputElement) {
    console.log('ciao');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        this.setSettings(json);
      } catch (err) {
        console.error('Errore nella lettura del JSON:', err);
      }
    };

    if (fileEvent.files && fileEvent.files.length > 0) reader.readAsText(fileEvent.files[0]);
    fileEvent.value = ''
  }
}
