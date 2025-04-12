import { WidgetLayout } from "@/components/dashboard/widget-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="account">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <WidgetLayout title="Account Settings">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="user@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <Button className="mt-4">Save Changes</Button>
            </div>
          </WidgetLayout>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <WidgetLayout title="Preferences">
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                </div>
                <Switch id="dark-mode" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                </div>
                <Switch id="notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-summary">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of your financial activity</p>
                </div>
                <Switch id="weekly-summary" defaultChecked />
              </div>

              <Button className="mt-4">Save Preferences</Button>
            </div>
          </WidgetLayout>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <WidgetLayout title="Notification Settings">
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bill-reminders">Bill Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified before bills are due</p>
                </div>
                <Switch id="bill-reminders" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="budget-alerts">Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you're close to exceeding your budget
                  </p>
                </div>
                <Switch id="budget-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goal-progress">Goal Progress</Label>
                  <p className="text-sm text-muted-foreground">Get notified about your financial goal progress</p>
                </div>
                <Switch id="goal-progress" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="unusual-activity">Unusual Activity</Label>
                  <p className="text-sm text-muted-foreground">Get notified about unusual spending activity</p>
                </div>
                <Switch id="unusual-activity" defaultChecked />
              </div>

              <Button className="mt-4">Save Notification Settings</Button>
            </div>
          </WidgetLayout>
        </TabsContent>
      </Tabs>
    </div>
  )
}

