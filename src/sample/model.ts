export interface UserGroup{
  name: string;
}

export enum Sex{
  male = "male",
  female = "female",
}
export interface User{
  id: number;
  name: string;
  code: string;
  mailAddress: string;
  birthday?: Date;
  phone: string;
  isMember: boolean;
  isEnable: boolean;
  sex?: Sex;
  age?: number;
  groups: UserGroup[];
  memo?: string;
  rank? : string;
}

