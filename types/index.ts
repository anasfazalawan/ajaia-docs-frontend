export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export type ShareRole = 'viewer' | 'editor';

export interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  role: ShareRole;
  user: PublicUser;
}

export interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  owner: PublicUser;
  access: 'owner' | 'shared';
}

export interface DocumentDetail extends DocumentSummary {
  content: string;
  role: 'owner' | ShareRole;
  shares: DocumentShare[];
  attachments: Array<{ id: string; filename: string; mimetype: string; path: string }>;
}

export interface DocumentListResponse {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  createdAt: string;
}
