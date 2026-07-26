/**
 * Types and Interfaces for the Fadail (فضائل) Application.
 */

export interface TextItem {
  id: string;
  content: string;
  source?: string;
  tags?: string[];
  createdAt: string;
}

export interface SubBranch {
  id: string;
  name: string;
  items: TextItem[];
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon identifier or Arabic character code
  color: string; // TailWind color class prefix (e.g., 'emerald', 'indigo', 'rose', 'amber')
  subBranches: SubBranch[];
}

