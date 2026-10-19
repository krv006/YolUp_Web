export interface MessageCapabilities {
  deleteEveryone?: boolean;
  pin?: boolean;
  forward?: boolean;
  reply: boolean;
  edit: boolean;
  delete: boolean;
  react: boolean;
}
