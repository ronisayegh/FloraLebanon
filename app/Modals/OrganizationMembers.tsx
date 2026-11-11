import type { OrganizationMemberSummary } from '@/@Types';
import { Card, ConfimModal, SafeInsetsWrapper, Scroll, Selector, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { MainColor } from '@/constants/Config';
import { NormalizeRemFont } from '@/constants/Helper';
import { formatDate } from '@/constants/Static';
import { useAppDialog, useDefaultContext } from '@/hooks';
import { GetOrganizationById, InviteOrganizationMember, RemoveOrganizationMember, UpdateOrganizationMemberRole } from '@/services';
import { GlobalStyle } from '@/styles';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const getParamValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const inviteRoleOptions = [
  { label: 'Collector', value: 'Collector' },
  { label: 'Coordinator', value: 'Coordinator' },
];
type ConfirmationAction =
  | { type: 'cancelInvitation'; member: OrganizationMemberSummary }
  | { type: 'makeManager'; member: OrganizationMemberSummary }
  | { type: 'removeMember'; member: OrganizationMemberSummary };

const getMemberDisplayName = (member: OrganizationMemberSummary) =>
  [member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ') || member.user?.email || 'this member';

const getConfirmationText = (action: ConfirmationAction | null) => {
  if (!action) return '';

  const displayName = getMemberDisplayName(action.member);
  if (action.type === 'cancelInvitation') return `Are you sure you want to cancel the invitation for ${displayName}?`;
  if (action.type === 'makeManager') return `Are you sure you want to make ${displayName} the organization manager?`;
  return `Are you sure you want to remove ${displayName} from this organization?`;
};

export default function OrganizationMembersScreen() {
  const params = useLocalSearchParams<{ organizationId?: string | string[]; organizationName?: string | string[] }>();
  const { showDialog, dialogNode } = useAppDialog();
  const currentUserId = useDefaultContext().SessionContext.value.user?.id;
  const organizationId = getParamValue(params.organizationId);
  const organizationName = getParamValue(params.organizationName) || 'Organization';
  const [members, setMembers] = useState<OrganizationMemberSummary[]>([]);
  const [email, setEmail] = useState('');
  const [roleInOrganization, setRoleInOrganization] = useState<string>('Collector');
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string>();
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);

  const activeMembers = useMemo(() => members.filter(member => member.status === 'ACTIVE'), [members]);
  const pendingMembers = useMemo(() => members.filter(member => member.status === 'PENDING'), [members]);
  const activeManager = useMemo(() => activeMembers.find(member => member.roleInOrganization === 'Manager'), [activeMembers]);

  const loadMembers = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const response = await GetOrganizationById(organizationId);
      if (!response.success) {
        showDialog({ title: 'Load failed', message: response.error.message });
        return;
      }
      setMembers(response.data.members);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load organization members right now.';
      showDialog({ title: 'Load failed', message });
    } finally {
      setLoading(false);
    }
  }, [organizationId, showDialog]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async () => {
    if (!organizationId) {
      showDialog({ title: 'Missing organization', message: 'This organization could not be identified.' });
      return;
    }
    if (!email.trim()) {
      showDialog({ title: 'Missing email', message: 'Enter a member email to invite.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await InviteOrganizationMember(organizationId, {
        email: email.trim().toLowerCase(),
        roleInOrganization,
      });
      if (!response.success) {
        showDialog({ title: 'Invite failed', message: response.error.message });
        return;
      }
      setEmail('');
      setRoleInOrganization('Collector');
      await loadMembers();
      showDialog({ title: 'Invitation sent', message: 'The member invitation has been created.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to invite this member right now.';
      showDialog({ title: 'Invite failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  const executeMakeManager = async (member: OrganizationMemberSummary) => {
    if (!organizationId) return;
    setUpdatingMemberId(member.id);
    try {
      const response = await UpdateOrganizationMemberRole(organizationId, member.id, { roleInOrganization: 'Manager' });
      if (!response.success) {
        showDialog({ title: 'Update failed', message: response.error.message });
        return;
      }
      await loadMembers();
      showDialog({ title: 'Manager updated', message: `${member.user?.firstName || member.user?.email || 'Member'} is now the organization manager.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update this member right now.';
      showDialog({ title: 'Update failed', message });
    } finally {
      setUpdatingMemberId(undefined);
    }
  };

  const executeRemove = async (member: OrganizationMemberSummary) => {
    if (!organizationId) return;
    setUpdatingMemberId(member.id);
    try {
      const response = await RemoveOrganizationMember(organizationId, member.id);
      if (!response.success) {
        showDialog({ title: 'Action failed', message: response.error.message });
        return;
      }
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update this member right now.';
      showDialog({ title: 'Action failed', message });
    } finally {
      setUpdatingMemberId(undefined);
    }
  };

  const handleConfirmAction = async () => {
    const action = confirmationAction;
    setConfirmationAction(null);
    if (!action) return;

    if (action.type === 'makeManager') {
      await executeMakeManager(action.member);
      return;
    }

    await executeRemove(action.member);
  };

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <ModalHeader />
        <Scroll contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <Card showBorder borderColor={MainColor} style={styles.card}>
            <ThemedTxt text={organizationName} color={MainColor} fontWeight="700" rem={2} />
            <ThemedTxt
              text="Invite members by email and manage active or pending organization members."
              variant="Secondary"
              style={[GlobalStyle.tMar4, NormalizeRemFont(1, 1.4)]}
            />

            <View style={GlobalStyle.tMar12}>
              <ThemedTxt text="Invite by email" fontWeight="600" rem={1.2} style={GlobalStyle.bMar8} />
              <TextInputIcon value={email} onChangeText={setEmail} placeholder="member@email.com" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={GlobalStyle.tMar12}>
              <ThemedTxt text="Role in organization" fontWeight="600" rem={1.2} style={GlobalStyle.bMar8} />
              <Selector
                items={inviteRoleOptions}
                value={roleInOrganization}
                onValueChange={value => setRoleInOrganization(String(value || 'Collector'))}
                placeholder={{ label: 'Select role', value: null }}
                required
              />
            </View>
            <ThemedBtnTxt
              text={isSubmitting ? 'Sending...' : 'Send Invitation'}
              buttonStyle={styles.submitBtn}
              enabled={!isSubmitting && !!email.trim()}
              onPress={handleInvite}
              rem={1.2}
            />
          </Card>

          <Card showBorder borderColor={MainColor} style={[styles.card, GlobalStyle.tMar16]}>
            <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
              <ThemedTxt text="Pending Invitations" color={MainColor} fontWeight="700" rem={1.25} />
              {isLoading ? <ThemedTxt text="Loading..." variant="Secondary" fontSize={11} /> : null}
            </View>
            {pendingMembers.length === 0 ? (
              <ThemedView variant="Secondary" style={[styles.memberBox, GlobalStyle.tMar12]}>
                <ThemedTxt text="No pending invitations." variant="Secondary" fontSize={13} />
              </ThemedView>
            ) : (
              pendingMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  actionLabel="Cancel"
                  onAction={() => setConfirmationAction({ type: 'cancelInvitation', member })}
                  isLoading={updatingMemberId === member.id}
                />
              ))
            )}
          </Card>

          <Card showBorder borderColor={MainColor} style={[styles.card, GlobalStyle.tMar16]}>
            <ThemedTxt text="Active Members" color={MainColor} fontWeight="700" rem={1.25} />
            {activeManager?.user?.id === currentUserId ? (
              <ThemedTxt
                text="You cannot remove yourself while you are the current manager. Promote another active member first."
                variant="Secondary"
                style={[GlobalStyle.tMar8, NormalizeRemFont(0.75, 1.4)]}
              />
            ) : null}
            {activeMembers.length === 0 ? (
              <ThemedView variant="Secondary" style={[styles.memberBox, GlobalStyle.tMar12]}>
                <ThemedTxt text="No active members yet." variant="Secondary" fontSize={13} />
              </ThemedView>
            ) : (
              activeMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  actionLabel="Remove"
                  onAction={() => setConfirmationAction({ type: 'removeMember', member })}
                  showMakeManager={member.roleInOrganization !== 'Manager'}
                  onMakeManager={() => setConfirmationAction({ type: 'makeManager', member })}
                  disableRemove={member.user?.id === currentUserId && member.roleInOrganization === 'Manager'}
                  isLoading={updatingMemberId === member.id}
                />
              ))
            )}
          </Card>
        </Scroll>
      </ThemedView>
      <ConfimModal
        Text={getConfirmationText(confirmationAction)}
        isVisible={Boolean(confirmationAction)}
        onAccept={() => void handleConfirmAction()}
        onReject={() => setConfirmationAction(null)}
      />
      {dialogNode}
    </SafeInsetsWrapper>
  );
}

function MemberRow(props: {
  member: OrganizationMemberSummary;
  actionLabel: string;
  onAction: () => void;
  showMakeManager?: boolean;
  onMakeManager?: () => void;
  disableRemove?: boolean;
  isLoading?: boolean;
}) {
  const { member, actionLabel, onAction, showMakeManager, onMakeManager, disableRemove, isLoading } = props;
  const displayName = getMemberDisplayName(member);

  return (
    <ThemedView variant="Secondary" style={[styles.memberBox, GlobalStyle.tMar12]}>
      <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
        <View style={GlobalStyle.flex}>
          <ThemedTxt text={displayName} fontWeight="700" fontSize={14} />
          {member.user?.email ? <ThemedTxt text={member.user.email} variant="Secondary" fontSize={12} style={GlobalStyle.tMar4} /> : null}
          {member.roleInOrganization ? <ThemedTxt text={member.roleInOrganization} variant="Secondary" fontSize={12} style={GlobalStyle.tMar4} /> : null}
          <ThemedTxt
            text={
              member.status === 'PENDING' ? 'Invitation pending' : `Joined ${formatDate(member.joinedAt || member.createdAt || Date.now().toLocaleString())}`
            }
            variant="Secondary"
            fontSize={11}
            style={GlobalStyle.tMar4}
          />
        </View>
        <View style={styles.memberActions}>
          {showMakeManager && onMakeManager ? (
            <ThemedBtnTxt
              text={isLoading ? 'Saving...' : 'Make Manager'}
              variant="OutLine"
              buttonStyle={styles.memberActionBtn}
              onPress={onMakeManager}
              disabled={isLoading}
              enabled={!isLoading}
              rem={1}
            />
          ) : null}
          <ThemedBtnTxt
            text={isLoading ? 'Working...' : actionLabel}
            variant="OutLine"
            buttonStyle={[styles.memberActionBtn, showMakeManager ? GlobalStyle.tMar8 : undefined]}
            onPress={onAction}
            disabled={disableRemove || isLoading}
            enabled={!disableRemove && !isLoading}
            rem={1}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    borderWidth: 1.5,
    borderColor: MainColor,
    borderRadius: 18,
  },
  submitBtn: {
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  memberBox: {
    padding: 12,
    borderRadius: 12,
  },
  memberActions: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  memberActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
