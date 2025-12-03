export type AccountSettingsTabKey = "profile" | "organization" | "communications" | "security" | "danger"

export type AccountSettingsMobilePage = "menu" | AccountSettingsTabKey

export type AccountSettingsErrorKey =
  | "firstName"
  | "lastName"
  | "phone"
  | "orgName"
  | "orgDesc"
  | "applyingAs"
  | "stage"
  | "problem"
