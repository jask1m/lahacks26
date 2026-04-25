'use client'

import { useState } from 'react'
import { Button } from '@/demo-site/components/ui/button'
import { Switch } from '@/demo-site/components/ui/switch'
import { Input } from '@/demo-site/components/ui/input'
import { Label } from '@/demo-site/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/demo-site/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldMessage } from '@/demo-site/components/ui/field'
import { Separator } from '@/demo-site/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/demo-site/components/ui/alert-dialog'
import { useStore } from '@/demo-site/lib/store-context'

export default function SettingsPage() {
  const { showToast } = useStore()
  
  const [preferences, setPreferences] = useState({
    emailMarketing: true,
    smsNotifications: false,
    orderUpdates: true,
    newArrivals: true,
    saleAlerts: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [passwordError, setPasswordError] = useState('')

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
    showToast('Preferences updated', 'success')
  }

  const handlePasswordChange = () => {
    setPasswordError('')
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    // Simulate password change
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    showToast('Password updated successfully', 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="settings-title">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Notification Preferences */}
      <Card data-testid="notification-settings">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between" data-testid="pref-email-marketing">
            <div>
              <Label className="text-base">Email Marketing</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails and newsletters
              </p>
            </div>
            <Switch
              checked={preferences.emailMarketing}
              onCheckedChange={() => handlePreferenceChange('emailMarketing')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between" data-testid="pref-sms-notifications">
            <div>
              <Label className="text-base">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get text messages for important updates
              </p>
            </div>
            <Switch
              checked={preferences.smsNotifications}
              onCheckedChange={() => handlePreferenceChange('smsNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between" data-testid="pref-order-updates">
            <div>
              <Label className="text-base">Order Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your orders
              </p>
            </div>
            <Switch
              checked={preferences.orderUpdates}
              onCheckedChange={() => handlePreferenceChange('orderUpdates')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between" data-testid="pref-new-arrivals">
            <div>
              <Label className="text-base">New Arrivals</Label>
              <p className="text-sm text-muted-foreground">
                Be the first to know about new products
              </p>
            </div>
            <Switch
              checked={preferences.newArrivals}
              onCheckedChange={() => handlePreferenceChange('newArrivals')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between" data-testid="pref-sale-alerts">
            <div>
              <Label className="text-base">Sale Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about sales and discounts
              </p>
            </div>
            <Switch
              checked={preferences.saleAlerts}
              onCheckedChange={() => handlePreferenceChange('saleAlerts')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card data-testid="password-settings">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-4 max-w-md">
            <Field>
              <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                data-testid="current-password"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                data-testid="new-password"
              />
              <FieldMessage>Must be at least 8 characters</FieldMessage>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                data-testid="confirm-password"
              />
            </Field>

            {passwordError && (
              <p className="text-sm text-destructive" data-testid="password-error">
                {passwordError}
              </p>
            )}

            <Button onClick={handlePasswordChange} data-testid="update-password-btn">
              Update Password
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive" data-testid="danger-zone">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="delete-account-btn">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="cancel-delete-btn">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="confirm-delete-btn"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
