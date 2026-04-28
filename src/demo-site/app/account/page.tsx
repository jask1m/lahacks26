'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/demo-site/components/ui/button'
import { Input } from '@/demo-site/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/demo-site/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/demo-site/components/ui/avatar'
import { Field, FieldGroup, FieldLabel } from '@/demo-site/components/ui/field'
import { mockAddresses } from '@/demo-site/lib/mock-data'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
  })
  const [editForm, setEditForm] = useState(profile)

  const handleSave = () => {
    setProfile(editForm)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm(profile)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card data-testid="profile-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                data-testid="edit-profile-btn"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20" data-testid="profile-avatar">
              <AvatarImage src="" alt={`${profile.firstName} ${profile.lastName}`} />
              <AvatarFallback className="text-2xl">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>

            {isEditing ? (
              <FieldGroup className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                      data-testid="profile-first-name"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                      data-testid="profile-last-name"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    data-testid="profile-email"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    data-testid="profile-phone"
                  />
                </Field>
                <div className="flex gap-2">
                  <Button onClick={handleSave} data-testid="save-profile-btn">
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel} data-testid="cancel-edit-btn">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </FieldGroup>
            ) : (
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold" data-testid="profile-name">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-muted-foreground">Member since January 2024</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="profile-email-display">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="profile-phone-display">{profile.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Book */}
      <Card data-testid="address-book-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Address Book</CardTitle>
              <CardDescription>Manage your shipping addresses</CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="add-address-btn">
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {mockAddresses.map((address) => (
              <div 
                key={address.id}
                className="border rounded-lg p-4 relative"
                data-testid={`address-${address.id}`}
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{address.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.street}<br />
                      {address.city}, {address.state} {address.zip}<br />
                      {address.country}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="ghost" size="sm" data-testid={`edit-address-${address.id}`}>
                    Edit
                  </Button>
                  {!address.isDefault && (
                    <Button variant="ghost" size="sm" data-testid={`delete-address-${address.id}`}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-orders">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">4</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-wishlist">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Wishlist Items</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-reviews">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">Reviews Written</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-rewards">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">250</p>
            <p className="text-sm text-muted-foreground">Reward Points</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
