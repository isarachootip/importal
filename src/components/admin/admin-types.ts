import type { RoleCode } from "@prisma/client";

export interface AdminBrandDto {
  id: string;
  code: string;
  name: string;
  groupName: string;
  ownerId: string | null;
  isActive: boolean;
}

export interface AdminUserOption {
  id: string;
  label: string;
  roles: RoleCode[];
}

export interface AdminCaseConfigDto {
  id: string;
  caseNumber: number;
  name: string;
  infoDays: number;
  designDays: number;
  productionDays: number;
  logisticDays: number;
}

export interface AdminApprovalRuleDto {
  id: string;
  stageKey: string;
  stepOrder: number;
  role: RoleCode;
  isParallel: boolean;
  isEnabled: boolean;
}

export interface AdminHolidayDto {
  id: string;
  date: string;
  yearBE: number;
  nameTh: string;
  isSubstitute: boolean;
}

export interface AdminSettingDto {
  key: string;
  value: boolean | number | string;
  description: string | null;
}

export interface AdminMasterDto {
  brands: AdminBrandDto[];
  users: AdminUserOption[];
  caseConfigs: AdminCaseConfigDto[];
  approvalRules: AdminApprovalRuleDto[];
  holidays: AdminHolidayDto[];
  settings: AdminSettingDto[];
}
