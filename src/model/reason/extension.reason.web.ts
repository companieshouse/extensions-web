export interface ReasonWeb {
  id: string;
  reason: string;
  attachments: Array<{
    id: string;
    name: string;
  }>;
  start_on: string;
  end_on: string;
  affected_person: string;
  reason_information: string;
  continued_illness: string;
  reason_status: string;
}
