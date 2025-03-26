"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { FiEdit, FiTrash2, FiSearch, FiX, FiPlus, FiDollarSign, FiImage, FiList } from "react-icons/fi";
import { fetchAllBottlesFromCatalog, addBottleToCatalog, updateBottleInCatalog, deleteBottleFromCatalog, uploadBottleImage } from "@/lib/services/catalog";

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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300 digital-glow-soft">Add Bottle to Catalog</h2>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-16 h-16 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Add New Bottle Form */}
      <div className="bg-zinc-900 border border-cyan-900/30 p-6 rounded-lg mb-8 relative">
        <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-semibold mb-4 text-cyan-200 flex items-center">
            <FiPlus className="mr-2 text-cyan-400" />
            Add New Bottle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="bottleName" className="block text-sm font-medium mb-2 text-cyan-200">
                  Bottle Name <span className="text-cyan-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="bottleName"
                    type="text"
                    className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="Enter bottle name"
                    value={newBottleName}
                    onChange={(e) => setNewBottleName(e.target.value)}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="bottlePrice" className="block text-sm font-medium mb-2 text-cyan-200">
                  Price <span className="text-cyan-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-cyan-600" />
                  </div>
                  <input
                    id="bottlePrice"
                    type="number"
                    className="w-full p-3 pl-8 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="Enter price"
                    value={newBottlePrice}
                    onChange={(e) => setNewBottlePrice(e.target.value)}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg"></div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-cyan-200">
                  Bottle Image <span className="text-cyan-500">*</span>
                </label>
                <label className="flex items-center justify-center w-full h-12 px-4 transition bg-zinc-800/80 border border-cyan-900/50 hover:border-cyan-500/70 rounded-lg cursor-pointer">
                  <FiImage className="mr-2 text-cyan-500" />
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
              
              <button
                onClick={handleAddNewBottle}
                className="w-full p-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 rounded-lg text-white font-medium transition-all border border-cyan-500/50 relative overflow-hidden group"
              >
                <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
                <span className="relative z-10 flex items-center justify-center">
                  <FiPlus className="mr-2" />
                  Add Bottle
                </span>
              </button>
            </div>
            
            <div className="flex items-center justify-center">
              {newBottleImagePreview ? (
                <div className="relative w-48 h-48 border border-cyan-900/50 rounded-lg p-1 bg-black/50">
                  <Image 
                    src={newBottleImagePreview} 
                    alt="New bottle preview" 
                    fill
                    style={{objectFit: "contain"}}
                    className="rounded-lg"
                  />
                  <button 
                    onClick={() => {
                      URL.revokeObjectURL(newBottleImagePreview);
                      setNewBottleImagePreview(null);
                      setNewBottleImage(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FiX className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-48 bg-zinc-800/50 border border-cyan-900/30 rounded-lg flex flex-col items-center justify-center">
                  <FiImage size={32} className="text-cyan-900/70 mb-2" />
                  <span className="text-gray-400 text-center">No image selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-cyan-600" />
        </div>
        <input
          type="text"
          className="w-full p-3 pl-10 bg-zinc-900 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
          placeholder="Search bottles"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Bottle Catalog Header */}
      <div className="flex items-center mb-4">
        <FiList className="text-cyan-500 mr-2" />
        <h3 className="text-lg font-medium text-cyan-200">Current Bottle Catalog</h3>
      </div>

      {/* Bottle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBottles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 border border-dashed border-cyan-900/30 rounded-lg bg-zinc-900/50">
            <FiList size={48} className="mx-auto mb-4 text-cyan-900/50" />
            <p className="text-xl">No bottles in the catalog.</p>
          </div>
        ) : (
          filteredBottles.map((bottle) => (
            <div 
              key={bottle.id} 
              className="bg-zinc-900 border border-cyan-900/30 p-4 rounded-lg cursor-pointer hover:border-cyan-700/50 transition-all relative group"
              onClick={() => handleAddOrEditBottle(bottle)}
            >
              <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{bottle.name}</h3>
                    <p className="text-cyan-400">${bottle.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-cyan-900/30 p-2 rounded-full text-cyan-400 hover:bg-cyan-800/50 hover:text-cyan-300 transition-colors">
                    <FiEdit className="h-5 w-5" />
                  </div>
                </div>
                
                <div className="relative w-full h-36 bg-black/30 rounded-lg border border-cyan-900/20 p-1">
                  <Image
                    src={bottle.imageUrl}
                    alt={bottle.name}
                    fill
                    style={{objectFit: "contain"}}
                    className="rounded-lg"
                  />
                </div>
              </div>
              
              {/* Hover effect bottom gradient line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-zinc-900 border border-cyan-900/50 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-cyan-300">Edit Bottle</h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white bg-zinc-800/80 p-2 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="modalName" className="block text-sm font-medium mb-2 text-cyan-200">
                  Bottle Name
                </label>
                <input
                  id="modalName"
                  type="text"
                  className="w-full p-3 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="modalPrice" className="block text-sm font-medium mb-2 text-cyan-200">
                  Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-cyan-600" />
                  </div>
                  <input
                    id="modalPrice"
                    type="number"
                    className="w-full p-3 pl-8 bg-zinc-800/80 rounded-lg text-white border border-cyan-900/50 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-cyan-200">
                  Bottle Image
                </label>
                <div className="relative w-full h-48 mb-3 bg-black/30 rounded-lg border border-cyan-900/30 p-1">
                  <Image
                    src={modalImageUrl || "https://via.placeholder.com/150"}
                    alt="Bottle"
                    fill
                    style={{objectFit: "contain"}}
                    className="rounded-lg"
                  />
                </div>
                <label className="flex items-center justify-center w-full h-12 px-4 transition bg-zinc-800/80 border border-cyan-900/50 hover:border-cyan-500/70 rounded-lg cursor-pointer">
                  <FiImage className="mr-2 text-cyan-500" />
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
                <button
                  onClick={handleSaveBottle}
                  className="flex-1 p-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 rounded-lg text-white font-medium transition-all border border-cyan-500/50 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
                  <span className="relative z-10">Save Changes</span>
                </button>
                <button
                  onClick={handleDeleteBottle}
                  className="flex-1 p-3 bg-gradient-to-r from-red-900/80 to-red-700/80 hover:from-red-800 hover:to-red-600 rounded-lg text-white font-medium transition-all border border-red-500/50 flex items-center justify-center"
                >
                  <FiTrash2 className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 