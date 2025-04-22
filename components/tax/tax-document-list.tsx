"use client"

import { useState, useEffect } from "react"
import { PlusCircle, FileText, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TaxDocumentItem, TaxDocument } from "./tax-document-item"
import { TaxDocumentForm } from "./tax-document-form"
import { useToast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"

export function TaxDocumentList() {
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingDocument, setEditingDocument] = useState<TaxDocument | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tax/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error("Error fetching tax documents:", error)
      toast({
        title: "Error loading documents",
        description: "There was a problem loading your tax documents.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDocument = async (document: Omit<TaxDocument, "id">) => {
    try {
      const response = await fetch('/api/tax/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create document')
      }
      
      const newDocument = await response.json()
      setDocuments(prev => [...prev, newDocument])
      setShowForm(false)
      toast({
        title: "Document created",
        description: "Your tax document has been successfully created.",
      })
    } catch (error) {
      console.error("Error creating tax document:", error)
      toast({
        title: "Error creating document",
        description: "There was a problem creating your tax document.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDocument = async (document: TaxDocument) => {
    try {
      const response = await fetch(`/api/tax/documents/${document.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update document')
      }
      
      const updatedDocument = await response.json()
      setDocuments(prev => 
        prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
      )
      setEditingDocument(null)
      toast({
        title: "Document updated",
        description: "Your tax document has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating tax document:", error)
      toast({
        title: "Error updating document",
        description: "There was a problem updating your tax document.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/tax/documents/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      toast({
        title: "Document deleted",
        description: "Your tax document has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting tax document:", error)
      toast({
        title: "Error deleting document",
        description: "There was a problem deleting your tax document.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const documentToUpdate = documents.find(doc => doc.id === id)
      if (!documentToUpdate) return
      
      const updatedDocument = { ...documentToUpdate, status }
      
      const response = await fetch(`/api/tax/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDocument),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update document status')
      }
      
      const result = await response.json()
      setDocuments(prev => 
        prev.map(doc => doc.id === result.id ? result : doc)
      )
    } catch (error) {
      console.error("Error updating document status:", error)
      toast({
        title: "Error updating status",
        description: "There was a problem updating the document status.",
        variant: "destructive",
      })
      throw error
    }
  }

  const filteredDocuments = documents.filter(doc => {
    if (!doc || !doc.name || !doc.type) return false;
    
    return (
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tax Documents</CardTitle>
            <CardDescription>Manage and organize your tax documents</CardDescription>
          </div>
          <Button onClick={() => { setEditingDocument(null); setShowForm(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Document Form */}
        {showForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <TaxDocumentForm
              initialData={editingDocument}
              onSubmit={editingDocument ? handleUpdateDocument : handleCreateDocument}
              onCancel={() => { setShowForm(false); setEditingDocument(null); }}
            />
          </div>
        )}

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <TaxDocumentItem
                key={document.id}
                document={document}
                onEdit={(doc) => { setEditingDocument(doc); setShowForm(true); }}
                onDelete={handleDeleteDocument}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            title="No documents found"
            description={
              searchQuery
                ? "No documents match your search. Try a different query."
                : "You haven't added any tax documents yet. Add your first document to get started."
            }
            action={
              !searchQuery && (
                <Button onClick={() => { setEditingDocument(null); setShowForm(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Document
                </Button>
              )
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
