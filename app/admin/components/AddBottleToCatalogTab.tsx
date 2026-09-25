"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FiEdit, FiTrash2, FiSearch, FiX, FiPlus, FiDollarSign, FiImage, FiList } from "react-icons/fi";
import { fetchAllBottlesFromCatalog, addBottleToCatalog, updateBottleInCatalog, deleteBottleFromCatalog, uploadBottleImage } from "@/lib/services/catalog";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

interface BottleCatalog {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export default function AddBottleToCatalogTab() {
  const [catalogBottles, setCatalogBottles] = useState<BottleCatalog[]>([]);
  const [modalName, setModalName] = useState<string>("");
  const [modalPrice, setModalPrice] = useState<string>("");
  const [modalImageUrl, setModalImageUrl] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentBottle, setCurrentBottle] = useState<BottleCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [newBottleName, setNewBottleName] = useState("");
  const [newBottlePrice, setNewBottlePrice] = useState("");
  const [newBottleImage, setNewBottleImage] = useState<File | null>(null);
  const [newBottleImagePreview, setNewBottleImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadCatalogBottles();
  }, []);

  const loadCatalogBottles = async () => {
    try {
      setLoading(true);
      const bottles = await fetchAllBottlesFromCatalog();
      setCatalogBottles(bottles);
    } catch (error) {
      toast.error("Failed to fetch bottle catalog.");
      console.error("Error fetching bottles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditBottle = (bottle: BottleCatalog) => {
    setCurrentBottle(bottle);
    setModalName(bottle.name);
    setModalPrice(bottle.price.toString());
    setModalImageUrl(bottle.imageUrl);
    setEditImageFile(null);
    setIsModalVisible(true);
  };

  const handleSaveBottle = async () => {
    if (!currentBottle || !modalPrice || !modalName) {
      toast.error("Bottle name and price are required.");
      return;
    }

    const parsedPrice = parseFloat(modalPrice);

    if (isNaN(parsedPrice)) {
      toast.error("Price must be a valid number.");
      return;
    }

    try {
      setLoading(true);
      
      let finalImageUrl = modalImageUrl;
      
      // If a new image was selected, upload it first
      if (editImageFile) {
        finalImageUrl = await uploadBottleImage(currentBottle.id, editImageFile);
      }
      
      await updateBottleInCatalog(currentBottle.id, {
        name: modalName,
        price: parsedPrice,
        imageUrl: finalImageUrl,
      });
      
      toast.success("Bottle updated successfully!");
      setIsModalVisible(false);
      await loadCatalogBottles();
    } catch (error) {
      console.error("Error updating bottle:", error);
      toast.error("Failed to update the bottle.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setModalImageUrl(previewUrl);
    }
  };

  const handleDeleteBottle = async () => {
    if (!currentBottle) return;

    if (confirm(`Are you sure you want to delete ${currentBottle.name}?`)) {
      try {
        setLoading(true);
        await deleteBottleFromCatalog(currentBottle.id);
        await loadCatalogBottles();
        setIsModalVisible(false);
        toast.success("Bottle deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete bottle.");
        console.error("Error deleting bottle:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewBottleImage(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setNewBottleImagePreview(previewUrl);
    }
  };

  const handleAddNewBottle = async () => {
    if (!newBottleName || !newBottlePrice || !newBottleImage) {
      toast.error("All fields are required.");
      return;
    }

    const parsedPrice = parseFloat(newBottlePrice);

    if (isNaN(parsedPrice)) {
      toast.error("Price must be a valid number.");
      return;
    }

    try {
      setLoading(true);
      // First, create a bottle with a placeholder image
      const bottleData = {
        name: newBottleName,
        price: parsedPrice,
        imageUrl: "placeholder",
      };
      
      // Add the bottle to get an ID
      const newBottleId = await addBottleToCatalog(bottleData);
      
      // Now upload the image with the bottle ID
      const imageUrl = await uploadBottleImage(newBottleId, newBottleImage);
      
      // Update the bottle with the real image URL
      await updateBottleInCatalog(newBottleId, { imageUrl });
      
      // Refresh the list
      await loadCatalogBottles();
      
      // Reset form
      setNewBottleName("");
      setNewBottlePrice("");
      setNewBottleImage(null);
      setNewBottleImagePreview(null);
      
      toast.success("Bottle added successfully!");
    } catch (error) {
      toast.error("Failed to add bottle.");
      console.error("Error adding bottle:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBottles = catalogBottles.filter((bottle) =>
    bottle.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCloseModal = () => {
    setIsModalVisible(false);
    if (editImageFile) {
      URL.revokeObjectURL(modalImageUrl);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-accent-300 digital-glow-soft">Add Bottle to Catalog</h2>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-canvas bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <Spinner size="lg" className="text-accent-500 h-16 w-16" />
        </div>
      )}

      {/* Add New Bottle Form */}
      <Card padding="lg" texture className="mb-8">
        <div className="relative z-10">
          <h3 className="text-xl font-semibold mb-4 text-accent-200 flex items-center">
            <FiPlus className="mr-2 text-accent-400" />
            Add New Bottle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <Label htmlFor="bottleName" className="mb-2 text-accent-200">
                  Bottle Name <span className="text-accent-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="bottleName"
                    type="text"
                    className="p-3 bg-surface-raised/80 border border-accent-900/50 focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/50"
                    placeholder="Enter bottle name"
                    value={newBottleName}
                    onChange={(e) => setNewBottleName(e.target.value)}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="bottlePrice" className="mb-2 text-accent-200">
                  Price <span className="text-accent-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-accent-600" />
                  </div>
                  <Input
                    id="bottlePrice"
                    type="number"
                    className="p-3 pl-8 bg-surface-raised/80 border border-accent-900/50 focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/50"
                    placeholder="Enter price"
                    value={newBottlePrice}
                    onChange={(e) => setNewBottlePrice(e.target.value)}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
                </div>
              </div>
              
              <div className="mb-4">
                <Label className="mb-2 text-accent-200">
                  Bottle Image <span className="text-accent-500">*</span>
                </Label>
                <label className="flex items-center justify-center w-full h-12 px-4 transition bg-surface-raised/80 border border-accent-900/50 hover:border-accent-500/70 rounded-lg cursor-pointer">
                  <FiImage className="mr-2 text-accent-500" />
                  <span className="text-sm">
                    {newBottleImage ? "Change Image" : "Select Image"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handlePickImage}
                    accept="image/*"
                  />
                </label>
              </div>
              
              <Button
                onClick={handleAddNewBottle}
                variant="accent" size="md" full
              >
                <FiPlus />
                Add Bottle
              </Button>
            </div>
            
            <div className="flex items-center justify-center">
              {newBottleImagePreview ? (
                <div className="relative w-48 h-48 border border-accent-900/50 rounded-lg p-1 bg-canvas/50">
                  <Image 
                    src={newBottleImagePreview} 
                    alt="New bottle preview" 
                    fill
                    className="rounded-lg object-contain"
                  />
                  <Button 
                    onClick={() => {
                      URL.revokeObjectURL(newBottleImagePreview);
                      setNewBottleImagePreview(null);
                      setNewBottleImage(null);
                    }}
                    variant="danger" size="icon" shape="pill" aria-label="Remove image" className="absolute top-2 right-2"
                  >
                    <FiX className="text-fg" />
                  </Button>
                </div>
              ) : (
                <div className="w-48 h-48 bg-surface-raised/50 border border-accent-900/30 rounded-lg flex flex-col items-center justify-center">
                  <FiImage size={32} className="text-accent-900/70 mb-2" />
                  <span className="text-fg-muted text-center">No image selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-accent-600" />
        </div>
        <Input
          type="text"
          className="p-3 pl-10 bg-surface border border-accent-900/50 focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/50"
          placeholder="Search bottles"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Bottle Catalog Header */}
      <div className="flex items-center mb-4">
        <FiList className="text-accent-500 mr-2" />
        <h3 className="text-lg font-medium text-accent-200">Current Bottle Catalog</h3>
      </div>

      {/* Bottle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBottles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-fg-muted border border-dashed border-accent-900/30 rounded-lg bg-surface/50">
            <FiList size={48} className="mx-auto mb-4 text-accent-900/50" />
            <p className="text-xl">No bottles in the catalog.</p>
          </div>
        ) : (
          filteredBottles.map((bottle) => (
            <Card
              key={bottle.id}
              padding="none"
              texture
              interactive
              className="group p-4"
              onClick={() => handleAddOrEditBottle(bottle)}
            >
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-fg">{bottle.name}</h3>
                    <p className="text-accent-400">${bottle.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-accent-900/30 p-2 rounded-full text-accent-400 hover:bg-accent-800/50 hover:text-accent-300 transition-colors">
                    <FiEdit className="h-5 w-5" />
                  </div>
                </div>
                
                <div className="relative w-full h-36 bg-canvas/30 rounded-lg border border-accent-900/20 p-1">
                  <Image
                    src={bottle.imageUrl}
                    alt={bottle.name}
                    fill
                    className="rounded-lg object-contain"
                    unoptimized={bottle.imageUrl?.includes('firebasestorage.googleapis.com') || bottle.imageUrl?.includes('storage.googleapis.com')}
                  />
                </div>
              </div>
              
              {/* Hover effect bottom gradient line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-500/0 via-accent-500/40 to-accent-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-canvas/90 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <Card padding="none" texture className="max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-accent-300">Edit Bottle</h3>
                <Button 
                  onClick={handleCloseModal}
                  variant="subtle" size="icon" shape="pill" aria-label="Close"
                >
                  <FiX size={20} />
                </Button>
              </div>

              <div className="mb-4">
                <Label htmlFor="modalName" className="mb-2 text-accent-200">
                  Bottle Name
                </Label>
                <Input
                  id="modalName"
                  type="text"
                  className="p-3 bg-surface-raised/80 border border-accent-900/50 focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/50"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="modalPrice" className="mb-2 text-accent-200">
                  Price
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-accent-600" />
                  </div>
                  <Input
                    id="modalPrice"
                    type="number"
                    className="p-3 pl-8 bg-surface-raised/80 border border-accent-900/50 focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/50"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-2 text-accent-200">
                  Bottle Image
                </Label>
                <div className="relative w-full h-48 mb-3 bg-canvas/30 rounded-lg border border-accent-900/30 p-1">
                  <Image
                    src={modalImageUrl || "/placeholder-bottle.png"}
                    alt="Bottle"
                    fill
                    className="rounded-lg object-contain"
                    unoptimized={modalImageUrl?.includes('firebasestorage.googleapis.com') || modalImageUrl?.includes('storage.googleapis.com')}
                  />
                </div>
                <label className="flex items-center justify-center w-full h-12 px-4 transition bg-surface-raised/80 border border-accent-900/50 hover:border-accent-500/70 rounded-lg cursor-pointer">
                  <FiImage className="mr-2 text-accent-500" />
                  <span className="text-sm">Change Image</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleEditImage}
                    accept="image/*"
                  />
                </label>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSaveBottle}
                  variant="accent" size="md" className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleDeleteBottle}
                  variant="danger-subtle" size="md" className="flex-1"
                >
                  <FiTrash2 />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 