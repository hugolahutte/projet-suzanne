export type Profile = {
  id: string;
  name: string;
  age: number;
  nickname: string;
  level: string;
  interest: string;
  large_text: boolean;
};
export type Household = {
  id: string;
  name: string;
  role: "guardian" | "adult" | "child";
};
export type Me = { profile: Profile; households: Household[]; demo: boolean };
export type Account = {
  id: string;
  name: string;
  age: number;
  email: string;
  role: string;
  household: string;
};
export type Goal = { id: string; title: string; done: boolean };
export type Dashboard = {
  simulated: boolean;
  minutes: number;
  discoveries: number;
  week: number[];
  goals: Goal[];
};
export type Child = {
  id: string;
  name: string;
  level: string;
  minutes: number;
  topic: string;
  simulated: boolean;
};
