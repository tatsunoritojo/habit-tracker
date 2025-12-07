# Phase 10: Final Regression Test Checklist

Please execute the following tests on a physical device.

## 1. Onboarding & Auth
- [ ] **Fresh Install**: Clear app data, launch app. Verify Splash screen -> Onboarding.
- [ ] **Completion**: Finish onboarding. Verify transition to Home.
- [ ] **Relogin**: Close app, reopen. Verify direct entry to Home.

## 2. Card Creation
- [ ] **Category L1**: Tap "+". Verify category list loads.
- [ ] **Template**: Select category -> Select template. Verify creation.
- [ ] **Custom**: Tap "Original". Enter name "Test". Search. Tap "Create New". Select params. Save. Verify card appears.

## 3. Daily Operations
- [ ] **Log Habit**: Tap a card. Verify checkmark and count update.
- [ ] **Undo Log**: Tap again. Verify confirmation (if any) or toggle off.
- [ ] **Pull to Refresh**: Pull down on Home. Verify data refresh.

## 4. Edit & Settings
- [ ] **Edit Name**: Menu -> Edit. Change name. Save. Verify.
- [ ] **Reminders**: Edit -> Toggle Reminder ON -> Set Time 2 mins later. Verify notification receipt.
- [ ] **Archive**: Menu -> Archive. Verify disappearance from Home.
- [ ] **Restore**: Settings -> Archived Cards -> Restore. Verify appearance on Home.
- [ ] **Delete**: Delete a card. Verify permanent removal.

## 5. Gamification
- [ ] **Cheer**: Complete a habit. Wait for cheer notification (simulated or real).
- [ ] **Badges**: Check Card Detail for badges (Bronze/Silver/Gold).
- [ ] **Welcome Back**: (Dev only) Check if 3-day gapped login triggers modal.

## 6. Edge Cases
- [ ] **Offline**: Turn off WiFi/Data. Try to log. Verify graceful error or queue (if implemented) or error message.
- [ ] **Account Deletion**: Settings -> Delete Account. Verify full reset to Onboarding.
