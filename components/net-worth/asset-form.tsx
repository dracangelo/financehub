"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addAsset, updateAsset } from "@/app/actions/net-worth"
import { toast } from "sonner"

const assetFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  acquired_at: z.string().optional(),
  description: z.string().optional(),
})

type AssetFormValues = z.infer<typeof assetFormSchema>

const defaultValues: Partial<AssetFormValues> = {
  name: "",
  type: "",
  value: 0,
  acquired_at: "",
  description: "",
}

const assetTypes = [
  { value: "cash", label: "Cash & Savings" },
  { value: "investment", label: "Investments" },
  { value: "real_estate", label: "Real Estate" },
  { value: "vehicle", label: "Vehicles" },
  { value: "retirement", label: "Retirement Accounts" },
  { value: "business", label: "Business Interests" },
  { value: "personal", label: "Personal Property" },
  { value: "other", label: "Other Assets" },
]

interface AssetFormProps {
  asset?: {
    id: string
    name: string
    type: string
    value: number
    acquired_at?: string
    description?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const isEditMode = !!asset?.id

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset || defaultValues,
  })

  async function onSubmit(data: AssetFormValues) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      
      if (isEditMode && asset?.id) {
        formData.append("id", asset.id)
      }
      
      formData.append("name", data.name)
      formData.append("type", data.type)
      formData.append("value", data.value.toString())
      
      if (data.acquired_at) {
        formData.append("acquired_at", data.acquired_at)
      }
      
      if (data.description) {
        formData.append("description", data.description)
      }

      if (isEditMode) {
        await updateAsset(formData)
        toast.success("Asset updated successfully")
      } else {
        await addAsset(formData)
        toast.success("Asset added successfully")
      }

      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error submitting asset form:", error)
      toast.error(isEditMode ? "Failed to update asset" : "Failed to add asset")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter asset name" {...field} />
              </FormControl>
              <FormDescription>
                Name of your asset (e.g., Savings Account, Home, Car)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Type that best describes this asset
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0} 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                  value={field.value === null ? '' : field.value}
                />
              </FormControl>
              <FormDescription>
                Current value of this asset
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="acquired_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Acquired (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  placeholder="When did you acquire this asset?" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                The date when you acquired this asset
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional details about this asset" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Asset" : "Add Asset"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
