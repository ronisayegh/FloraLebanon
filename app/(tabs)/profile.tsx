import type { OrganizationMemberSummary, ProfileSummary, Submission } from '@/@Types';
import { AppBrandTitle, Card, ConfimModal, ModalWithX, Scroll, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { Folder2, Medal, Trophy } from '@/components/basic/Icons';
import { ProfileBadgeInfoModalContent, ProfileBadges } from '@/components/ProfileBadges';
import { ProfileGuestJoin } from '@/components/ProfileGuestJoin';
import { WeeklyForest } from '@/components/WeeklyForest';
import { MainColor } from '@/constants/Config';
import { Normalize, NormalizeRemFont, type FileType } from '@/constants/Helper';
import { formatShortDate } from '@/constants/Static';
import { ProfileSummaryKey, StoreManager } from '@/constants/Stores';
import { useAppDialog, useDefaultContext } from '@/hooks';
import {
  GetMyOrganizationInvitations,
  GetMyOrganizations,
  GetMyProfileSummary,
  GetMySubmissions,
  RemoveOrganizationMember,
  RespondToOrganizationInvitation,
  UpdateMyProfilePhoto,
  createSessionSnapshot,
} from '@/services';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [showModal, setShowModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [leaveOrganizationTarget, setLeaveOrganizationTarget] = useState<OrganizationMemberSummary | null>(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMemberSummary[]>([]);
  const [invitations, setInvitations] = useState<OrganizationMemberSummary[]>([]);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);
  const [isOrgLoading, setOrgLoading] = useState(false);
  const [isAvatarUploading, setAvatarUploading] = useState(false);
  const { RandomContext, SessionContext, ThemeContext } = useDefaultContext();
  const { showDialog, dialogNode } = useAppDialog();
  const session = SessionContext.value;
  const refreshSession = SessionContext.refreshSession;
  const displayName =
    [session.user?.firstName, session.user?.lastName].filter(Boolean).join(' ') || (session.status === 'local_guest' ? 'Offline Guest' : 'Guest Explorer');
  const subtitle = session.status === 'authenticated' ? 'FloraLebanon Collector' : 'Guest session';
  const verifiedCount = submissions.filter(item => item.status === 'VERIFIED').length;
  const underReviewCount = submissions.filter(item => item.status === 'UNDER_REVIEW').length;
  const submittedCount = submissions.filter(item => item.status === 'SUBMITTED').length;
  const weeklySubmissionCount = profileSummary?.weeklyVerifiedSubmissionCount ?? 0;
  const avatarUri = session.user?.profilePhotoUrl;
  const userRank = session.user?.rank;
  const userScore = session.user?.score ?? 0;
  const leaveOrganizationName = leaveOrganizationTarget?.organization.name || 'this organization';
  const isAuthenticated = session.status === 'authenticated';

  const toggleModal = () => setShowModal(prev => !prev);
  const toggleBadgesModal = () => setShowBadgesModal(prev => !prev);

  const handleLogout = async () => {
    toggleModal();
    await SessionContext.logout();
  };

  const handleProfilePhotoPick = useCallback(() => {
    if (session.status !== 'authenticated') return;

    const updateImage = async (image: FileType) => {
      setAvatarUploading(true);
      try {
        const response = await UpdateMyProfilePhoto(image);
        if (!response.success) {
          showDialog({ title: 'Upload failed', message: response.error.message });
          return;
        }
        await SessionContext.setSession(createSessionSnapshot(response.data.user));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update the profile photo right now.';
        showDialog({ title: 'Upload failed', message });
      } finally {
        setAvatarUploading(false);
      }
    };

    RandomContext.Set({ ...RandomContext.value, TempCameraRoll: { onCapture: updateImage, ratio: [1, 1], closeBeforeCapture: true } });
    router.push('/Modals/CameraRoll');
  }, [RandomContext, SessionContext, session.status, showDialog]);

  const canManageOrganization = useCallback((membership: OrganizationMemberSummary) => membership.roleInOrganization === 'Manager', [session.user?.role]);

  const loadSubmissions = useCallback(async () => {
    if (session.status !== 'authenticated') {
      setSubmissions([]);
      return;
    }

    try {
      const response = await GetMySubmissions();
      if (response.success) setSubmissions(response.data);
    } catch (_error) {}
  }, [session.status]);

  const loadCachedProfileSummary = useCallback(async () => {
    if (session.status !== 'authenticated' || !session.user?.id) {
      setProfileSummary(null);
      return;
    }

    const cachedSummary = await StoreManager.getJson(ProfileSummaryKey(session.user.id));
    if (cachedSummary) setProfileSummary(cachedSummary as ProfileSummary);
  }, [session.status, session.user?.id]);

  const loadProfileSummary = useCallback(async () => {
    if (session.status !== 'authenticated' || !session.user?.id) {
      setProfileSummary(null);
      return;
    }

    try {
      const response = await GetMyProfileSummary();
      if (!response.success) return;
      setProfileSummary(response.data);
      await StoreManager.setJson(ProfileSummaryKey(session.user.id), response.data);
    } catch (_error) {}
  }, [session.status, session.user?.id]);

  const loadOrganizations = useCallback(async () => {
    if (session.status !== 'authenticated') {
      setMemberships([]);
      setInvitations([]);
      return;
    }

    setOrgLoading(true);
    try {
      const [membershipsResponse, invitationsResponse] = await Promise.all([GetMyOrganizations(), GetMyOrganizationInvitations()]);
      if (membershipsResponse.success) setMemberships(membershipsResponse.data);
      if (invitationsResponse.success) setInvitations(invitationsResponse.data);
    } catch (_error) {
    } finally {
      setOrgLoading(false);
    }
  }, [session.status]);

  useEffect(() => {
    void loadCachedProfileSummary();
  }, [loadCachedProfileSummary]);

  const handleInvitationResponse = useCallback(
    async (invitation: OrganizationMemberSummary, status: 'ACTIVE' | 'REJECTED') => {
      try {
        const response = await RespondToOrganizationInvitation(invitation.organization.id, invitation.id, status);
        if (!response.success) {
          showDialog({ title: 'Request failed', message: response.error.message });
          return;
        }
        await loadOrganizations();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update the invitation right now.';
        showDialog({ title: 'Request failed', message });
      }
    },
    [loadOrganizations, showDialog],
  );

  const handleLeaveOrganization = useCallback(
    async (membership: OrganizationMemberSummary) => {
      try {
        const response = await RemoveOrganizationMember(membership.organization.id, membership.id);
        if (!response.success) {
          showDialog({ title: 'Request failed', message: response.error.message });
          return;
        }
        await loadOrganizations();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to leave the organization right now.';
        showDialog({ title: 'Request failed', message });
      }
    },
    [loadOrganizations, showDialog],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshSession();
      void loadSubmissions();
      void loadOrganizations();
      void loadProfileSummary();
    }, [loadOrganizations, loadProfileSummary, loadSubmissions, refreshSession]),
  );

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshSession(), loadSubmissions(), loadOrganizations(), loadProfileSummary()]);
    } finally {
      setRefreshing(false);
    }
  }, [isRefreshing, loadOrganizations, loadProfileSummary, loadSubmissions, refreshSession]);

  return (
    <ThemedView variant="Container" style={GlobalStyle.flex}>
      <Scroll refresh={{ isLoading: isRefreshing, onRefresh: handleRefresh }}>
        {!isAuthenticated ? (
          <ProfileGuestJoin />
        ) : (
          <>
            <Card style={GlobalStyle.tMar5}>
              <AppBrandTitle />
              <View style={[GlobalStyle.row, GlobalStyle.tMar16]}>
                <View style={styles.avatarContainer}>
                  <TouchableOpacity disabled={session.status !== 'authenticated' || isAvatarUploading} onPress={handleProfilePhotoPick} style={styles.avatarTouch}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name="person" size={Normalize(40)} color="#555" />
                    )}
                    {isAvatarUploading ? (
                      <View style={styles.avatarUploadingOverlay}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                </View>
                <View style={[GlobalStyle.lMar16, GlobalStyle.justifyCenter, GlobalStyle.flex]}>
                  <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
                    <ThemedTxt text={displayName} fontWeight="600" rem={1.25} variant="Primary" />
                    <ThemedBtnTxt text="Log Out" variant="OutLine" rem={0.75} buttonStyle={styles.headerLogoutBtn} onPress={toggleModal} />
                  </View>
                  <ThemedTxt text={subtitle} variant="Secondary" rem={0.875} />
                  <View style={[GlobalStyle.row, GlobalStyle.tMar8]}>
                    <View style={[GlobalStyle.row, GlobalStyle.flexCenter]}>
                      <Trophy size={Normalize(16)} filled strokeWidth={2} />
                      <ThemedTxt text={userRank ? ` Rank #${userRank}` : ' Unranked'} rem={0.875} color={MainColor} />
                    </View>
                    <View style={[GlobalStyle.row, GlobalStyle.flexCenter, GlobalStyle.lMar12]}>
                      <Medal size={Normalize(16)} filled strokeWidth={2} />
                      <ThemedTxt text={` ${userScore} pts`} rem={0.875} color={MainColor} />
                    </View>
                  </View>
                  <ThemedTxt
                    text={`Member since ${formatShortDate(session?.user?.createdAt, ' not synced yet')}`}
                    variant="Secondary"
                    rem={0.75}
                    style={GlobalStyle.tMar4}
                  />
                </View>
              </View>
            </Card>

            <Card>
              <TouchableOpacity style={[GlobalStyle.row, GlobalStyle.alignCenter, GlobalStyle.spaceBetween]} onPress={() => router.push('/Modals/Submissions')}>
                <View style={[GlobalStyle.row, GlobalStyle.alignCenter]}>
                  <ThemedView variant="Container" style={styles.iconBox}>
                    <Folder2 size={Normalize(24)} filled strokeWidth={2} />
                  </ThemedView>
                  <View>
                    <ThemedTxt text="My Submissions" fontWeight="500" style={NormalizeRemFont(1, 1.4)} />
                    <ThemedTxt text="View your photos and notes" variant="Secondary" style={NormalizeRemFont(0.875, 1.4)} />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={Normalize(24)} color={MainColor} />
              </TouchableOpacity>
              <View style={[GlobalStyle.row, GlobalStyle.tMar16, GlobalStyle.spaceBetween]}>
                <ThemedView variant="Container" style={styles.statSubBox}>
                  <ThemedTxt text={String(verifiedCount)} fontSize={18} fontWeight="700" color={MainColor} center />
                  <ThemedTxt text="Verified" fontSize={12} variant="Secondary" center />
                </ThemedView>
                <ThemedView variant="Container" style={styles.statSubBox}>
                  <ThemedTxt text={String(underReviewCount)} fontSize={18} fontWeight="700" color={MainColor} center />
                  <ThemedTxt text="Under Review" fontSize={12} variant="Secondary" center />
                </ThemedView>
                <ThemedView variant="Container" style={styles.statSubBox}>
                  <ThemedTxt text={String(submittedCount)} fontSize={18} fontWeight="700" color={MainColor} center />
                  <ThemedTxt text="Submitted" fontSize={12} variant="Secondary" center />
                </ThemedView>
              </View>
            </Card>

            <Card>
              <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
                <ThemedTxt text="My Organizations" fontWeight="700" fontSize={16} color={MainColor} />
                {isOrgLoading ? <ThemedTxt text="Syncing..." variant="Secondary" fontSize={11} /> : null}
              </View>
              <ThemedTxt
                text="Organizations let clubs, schools, NGOs, and field teams collect observations together. When your submission is verified, your points can help both your personal profile and your organization."
                variant="Secondary"
                fontSize={12}
                style={GlobalStyle.tMar5}
              />
              {invitations.length > 0 && (
                <View style={GlobalStyle.tMar12}>
                  <ThemedTxt text="Pending invitations" fontWeight="600" fontSize={13} color={MainColor} />
                  {invitations.map(invitation => (
                    <ThemedView key={invitation.id} variant="Secondary" style={[styles.orgBox, GlobalStyle.tMar8]}>
                      <ThemedTxt text={invitation.organization.name} fontWeight="700" rem={1.2} />
                      {invitation.roleInOrganization ? (
                        <ThemedTxt text={invitation.roleInOrganization} variant="Secondary" rem={0.75} style={GlobalStyle.tMar4} />
                      ) : null}
                      <ThemedTxt
                        text={`Invited by ${
                          [invitation.invitedBy?.firstName, invitation.invitedBy?.lastName].filter(Boolean).join(' ') || invitation.invitedBy?.email || 'Staff'
                        }`}
                        variant="Secondary"
                        rem={0.75}
                        style={GlobalStyle.tMar4}
                      />
                      <View style={[GlobalStyle.row, GlobalStyle.tMar8]}>
                        <ThemedBtnTxt
                          text="Accept"
                          buttonStyle={[styles.inlineBtn, GlobalStyle.flex]}
                          onPress={() => handleInvitationResponse(invitation, 'ACTIVE')}
                          rem={1}
                        />
                        <ThemedBtnTxt
                          text="Reject"
                          variant="OutLine"
                          buttonStyle={[styles.inlineBtn, GlobalStyle.flex, GlobalStyle.lMar8]}
                          onPress={() => handleInvitationResponse(invitation, 'REJECTED')}
                        />
                      </View>
                    </ThemedView>
                  ))}
                </View>
              )}
              <View style={GlobalStyle.tMar12}>
                <ThemedTxt text="Active memberships" fontWeight="600" fontSize={13} color={MainColor} />
                {memberships.length === 0 ? (
                  <ThemedView variant="Secondary" style={[styles.orgBox, GlobalStyle.tMar8]}>
                    <ThemedTxt text="You are not part of any organization yet." variant="Secondary" fontSize={13} />
                  </ThemedView>
                ) : (
                  memberships.map(membership => (
                    <ThemedView key={membership.id} variant="Secondary" style={[styles.orgBox, GlobalStyle.tMar8]}>
                      <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
                        <View style={GlobalStyle.flex}>
                          <ThemedTxt text={membership.organization.name} fontWeight="700" fontSize={14} />
                          {membership.roleInOrganization ? (
                            <ThemedTxt text={membership.roleInOrganization} variant="Secondary" fontSize={12} style={GlobalStyle.tMar4} />
                          ) : null}
                          {membership.joinedAt ? (
                            <ThemedTxt text={`Joined ${formatShortDate(membership.joinedAt)}`} variant="Secondary" fontSize={11} style={GlobalStyle.tMar4} />
                          ) : null}
                        </View>
                        <View style={styles.membershipActions}>
                          {canManageOrganization(membership) ? (
                            <ThemedBtnTxt
                              text="Manage"
                              variant="OutLine"
                              buttonStyle={styles.manageBtn}
                              onPress={() =>
                                router.push({
                                  pathname: '/Modals/OrganizationMembers',
                                  params: { organizationId: membership.organization.id, organizationName: membership.organization.name },
                                } as any)
                              }
                              rem={1}
                            />
                          ) : (
                            <ThemedBtnTxt
                              text="Leave"
                              variant="OutLine"
                              buttonStyle={styles.leaveBtn}
                              rem={1}
                              onPress={() => setLeaveOrganizationTarget(membership)}
                            />
                          )}
                        </View>
                      </View>
                    </ThemedView>
                  ))
                )}
              </View>
              <View style={GlobalStyle.tMar16}>
                <ThemedView variant="Secondary" style={styles.organizationInfoBox}>
                  <ThemedTxt text="Join an organization" fontWeight="600" rem={0.875} />
                  <ThemedTxt
                    text="An organization manager can invite you by email. Invitations will appear here, and you can accept or reject them."
                    variant="Secondary"
                    rem={0.75}
                    style={GlobalStyle.tMar4}
                  />
                </ThemedView>
                <ThemedView variant="Secondary" style={[styles.organizationInfoBox, GlobalStyle.tMar8]}>
                  <ThemedTxt text="Manage members" fontWeight="600" rem={0.875} />
                  <ThemedTxt
                    text="Managers can invite people, remove members, and promote another member to manager."
                    variant="Secondary"
                    rem={0.75}
                    style={GlobalStyle.tMar4}
                  />
                </ThemedView>
              </View>
            </Card>

            <Card>
              <ThemedTxt text="Wild Weekly Streak" fontWeight="500" rem={1} variant="Primary" />
              <WeeklyForest treeCount={weeklySubmissionCount} />
              <ThemedView variant="Container" style={[styles.infoSubCard, GlobalStyle.tMar12]}>
                <ThemedTxt text="How your forest grows" fontWeight="600" rem={0.875} variant="Secondary" />
                <ThemedTxt
                  text="Every submission adds a new tree to your forest. When you stop contributing, trees disappear."
                  variant="Secondary"
                  style={[GlobalStyle.tMar4, NormalizeRemFont(0.75, 1.33)]}
                />
              </ThemedView>
            </Card>

            <Card>
              <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
                <ThemedTxt text="My Badges" fontWeight="500" rem={1} variant="Primary" />
                <TouchableOpacity onPress={toggleBadgesModal} style={styles.badgesInfoBtn}>
                  <Ionicons name="information-circle-outline" size={Normalize(20)} color={MainColor} />
                </TouchableOpacity>
              </View>
              <ThemedTxt text="Collect badges across different categories" variant="Secondary" rem={0.75} />
              <ProfileBadges summary={profileSummary?.badges ?? null} isAuthenticated={session.status === 'authenticated'} />
            </Card>

            {/* <Card style={[GlobalStyle.bMar24]}>
          <ThemedTxt text="Settings" fontWeight="500" rem={1} variant="Primary" />
          <View style={GlobalStyle.tMar12}>
            <ThemedTxt text="Theme" fontWeight="600" fontSize={14} variant="Secondary" />
            <View style={[GlobalStyle.row, GlobalStyle.tMar8]}>
              <SwitchToggle
                label="Auto"
                value={theme === 'auto'}
                onValueChange={v => handleThemeChange(v, 'auto')}
                switchProps={{ disabled: theme === 'auto' }}
                style={GlobalStyle.flex}
              />
              <SwitchToggle label="Light" value={theme === 'light'} onValueChange={v => handleThemeChange(v, 'light')} style={GlobalStyle.flex} />
              <SwitchToggle label="Dark" value={theme === 'dark'} onValueChange={v => handleThemeChange(v, 'dark')} style={GlobalStyle.flex} />
            </View>
          </View>
          {session.status !== 'authenticated' && (
            <ThemedBtnTxt
              text="Login"
              buttonStyle={[GlobalStyle.pad10, GlobalStyle.tMar16]}
              fontSize={16}
              onPress={() => router.navigate('/Pages/LoginFlow/Login')}
            />
          )}
          {session.status === 'authenticated' && (
            <ThemedBtnTxt text="Logout" buttonStyle={[GlobalStyle.pad10, GlobalStyle.tMar16]} fontSize={16} onPress={toggleModal} />
          )}
        </Card> */}
          </>
        )}
      </Scroll>

      <ConfimModal Text="Are you sure you want to log out?" isVisible={showModal} onAccept={handleLogout} onReject={toggleModal} />
      <ConfimModal
        Text={`Are you sure you want to leave ${leaveOrganizationName}?`}
        isVisible={Boolean(leaveOrganizationTarget)}
        onAccept={() => {
          const target = leaveOrganizationTarget;
          setLeaveOrganizationTarget(null);
          if (target) void handleLeaveOrganization(target);
        }}
        onReject={() => setLeaveOrganizationTarget(null)}
      />
      <ModalWithX isVisible={showBadgesModal} closeModal={toggleBadgesModal} position="middle" style={styles.badgesModal} innerStyle={styles.badgesModalInner}>
        <ProfileBadgeInfoModalContent onClose={toggleBadgesModal} />
      </ModalWithX>
      {dialogNode}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    width: Normalize(80),
    height: Normalize(80),
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  avatarTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000080',
  },
  iconBox: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
  },
  statSubBox: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    width: '30%',
  },
  infoSubCard: {
    padding: 12,
    borderRadius: 10,
  },
  linkAction: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  orgBox: {
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  membershipActions: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  inlineBtn: {
    padding: 6,
    borderRadius: 10,
  },
  badgesInfoBtn: {
    padding: 2,
  },
  badgesModal: {
    paddingHorizontal: 16,
  },
  badgesModalInner: {
    borderRadius: 18,
  },
  organizationInfoBox: {
    padding: 12,
    borderRadius: 12,
  },
  manageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerLogoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
});
