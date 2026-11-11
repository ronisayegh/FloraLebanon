export type RequestSuccess<T> = { success: true; data: T; requestId?: string };
export type RequestFailure = { success: false; message?: string; error?: { message: string; code?: string }; requestId?: string };
export type Request<T> = RequestSuccess<T> | RequestFailure;

export type ApiErrorPayload = { message: string; code?: string };
export type ApiSuccess<T> = { success: true; data: T; requestId?: string };
export type ApiFailure = { success: false; error: ApiErrorPayload; requestId?: string; status?: number };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type AuthRole = 'SUPER_ADMIN' | 'STAFF' | 'USER' | 'GUEST';
export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePhotoUrl: string | null;
  role: AuthRole;
  score: number;
  rank: number | null;
  isActive: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type AuthPayload = { user: AuthUser; token: string };
export type GuestAuthPayload = AuthPayload & { deviceId: string | null };
export type SessionStatus = 'guest' | 'authenticated' | 'local_guest';
export type AuthSession = {
  status: SessionStatus;
  user: AuthUser | null;
  lastSyncedAt: string | null;
};
export const EmptyAuthSession: AuthSession = { status: 'local_guest', user: null, lastSyncedAt: null };
export type SubmissionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type SubmissionPhoto = {
  id: string;
  stepNumber: number;
  stepTitle?: string | null;
  displayOrder: number;
  path: string;
  url: string;
  browserUrl: string;
  caption?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type Submission = {
  id: string;
  fieldCode: string;
  status: SubmissionStatus;
  latitude: string;
  longitude: string;
  note?: string | null;
  adminComment?: string | null;
  collectedAt?: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  user?: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> | null;
  organization?: { id: string; name: string } | null;
  village?: { id: string; nameEn?: string | null; nameFr?: string | null; nameAr?: string | null } | null;
  plant?: { id: string; scientificName?: string | null; nameEn?: string | null; nameAr?: string | null } | null;
  reviewedByUser?: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> | null;
  photos: SubmissionPhoto[];
};
export type SubmissionPhotoStepInput = { stepNumber: number; stepTitle?: string };
export type MissionCode = 'MISSING_PLANT_PHOTOS';
export type UploadedAsset = {
  path: string;
  url: string;
  browserUrl: string;
};
export type MissionPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
};
export type MissingPlantPhotosMissionItem = {
  id: string;
  scientificName: string | null;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  coverImage: UploadedAsset | null;
  verifiedStepsCount: number;
  requiredStepsCount: number;
  missingStepNumbers: number[];
};
export type MissingPlantPhotosMissionList = {
  source?: 'CALCULATED' | 'CONFIGURED';
  items: MissingPlantPhotosMissionItem[];
  pagination: MissionPagination;
};
export type MissingPlantPhotosMissionDetail = {
  id: string;
  scientificName: string | null;
  nameEn: string;
  nameFr: string | null;
  nameAr: string | null;
  description: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  funFact: string | null;
  funFactFr: string | null;
  funFactAr: string | null;
  gallery: Array<
    UploadedAsset & {
      id: string;
      caption: string | null;
      isPrimary: boolean;
    }
  >;
  stepCoverage: {
    verifiedStepsCount: number;
    requiredStepsCount: number;
    missingStepNumbers: number[];
    coveredSteps: Array<
      UploadedAsset & {
        stepNumber: number;
        stepTitle: string | null;
        isPrimary: boolean;
      }
    >;
  };
  locations: Array<{
    id: string;
    nameEn: string | null;
    nameFr: string | null;
    nameAr: string | null;
  }>;
  contributorCount: number;
};
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';
export type OrganizationSummary = {
  id: string;
  name: string;
  description?: string | null;
  scoreCached?: number;
};
export type OrganizationMemberSummary = {
  id: string;
  userId?: string;
  organizationId?: string;
  roleInOrganization?: string | null;
  status: MembershipStatus;
  joinedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  organization: OrganizationSummary;
  invitedBy?: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName'> | null;
  user?: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> | null;
};
export type OrganizationDetail = OrganizationSummary & {
  createdAt?: string | null;
  updatedAt?: string | null;
  members: OrganizationMemberSummary[];
};
export type OrganizationCreationRequest = {
  id: string;
  name: string;
  description?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  approvedOrganizationId?: string | null;
};
export type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
  rank: number;
};
export type HomeSummary = {
  stats: {
    verifiedPlantPhotos: number;
    contributors: number;
    verifiedPlantSpecies: number;
  };
  leaderboards: {
    villages: LeaderboardEntry[];
    organizations: LeaderboardEntry[];
    individuals: LeaderboardEntry[];
  };
};
export type ProfileBadgeCategorySummary = {
  points: number;
  badgesEarned: number;
  threshold: number;
};
export type ProfileBadgeSummary = {
  species: ProfileBadgeCategorySummary;
  rareSpecies: ProfileBadgeCategorySummary;
  missions: ProfileBadgeCategorySummary;
  totalBadges: number;
};
export type ProfileSummary = {
  weeklyVerifiedSubmissionCount: number;
  badges: ProfileBadgeSummary;
};
export type FloweringPlantItem = {
  id: string;
  monthNumber: number;
  displayOrder: number;
  plant: {
    id: string;
    scientificName: string | null;
    nameEn: string;
    nameAr: string | null;
    image: {
      id: string;
      url: string;
      caption: string | null;
      isPrimary: boolean;
    } | null;
  };
};
export type FloweringPlantsResponse = {
  monthNumber: number;
  items: FloweringPlantItem[];
};
export type VillageFewSubmissionsItem = {
  id: string;
  nameEn: string;
  nameFr: string | null;
  nameAr: string | null;
  submissionCount: number;
};

export type ResolvedVillage = {
  id: string;
  nameEn: string;
  nameFr: string | null;
  nameAr: string | null;
  description: string | null;
  scoreCached?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
} | null;

export type PrivilegeType = { term_id: number; name: string; slug: string; parent: number; order?: string };
export type UserType = {
  id: number;
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  privilege: PrivilegeType[];
  category: PrivilegeType[];
  location?: string;
  job?: string;
  mobile?: string;
  bio?: string;
  isAdmin: boolean;
  logo: string;
  lastLogin?: number;
};
export const EmptyUser: UserType = { id: -1, name: 'Guest', username: 'Guest', firstName: 'Guest', lastName: '', fullName: 'Guest', email: '', privilege: [], category: [], isAdmin: false, logo: '' };
