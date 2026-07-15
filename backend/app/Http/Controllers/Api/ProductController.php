<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category:id,nama', 'brand:id,nama'])
            ->where('is_active', true);

        if ($request->filled('search')) {
            $query->where('nama', 'ilike', '%' . $request->search . '%');
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }
        if ($request->filled('sub_kategori')) {
            $query->where('sub_kategori', $request->sub_kategori);
        }

        return $query->orderBy('nama')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id'  => ['nullable', 'exists:categories,id'],
            'brand_id'     => ['nullable', 'exists:brands,id'],
            'nama'         => ['required', 'string', 'max:255'],
            'sku'          => ['nullable', 'string', 'max:255', 'unique:products,sku'],
            'satuan'       => ['nullable', 'string', 'max:50'],
            'stok'         => ['nullable', 'integer', 'min:0'],
            'stok_minimum' => ['nullable', 'integer', 'min:0'],
            'harga_beli'   => ['nullable', 'numeric', 'min:0'],
            'harga_umum'   => ['required', 'numeric', 'min:0'],
            'harga_mitra'  => ['required', 'numeric', 'min:0'],
            'is_active'    => ['nullable', 'boolean'],
        ]);

        $product = Product::create($data);

        return response()->json($product->load(['category:id,nama', 'brand:id,nama']), 201);
    }

    public function show(Product $product)
    {
        return $product->load(['category:id,nama', 'brand:id,nama']);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'category_id'  => ['nullable', 'exists:categories,id'],
            'brand_id'     => ['nullable', 'exists:brands,id'],
            'nama'         => ['required', 'string', 'max:255'],
            'sku'          => ['nullable', 'string', 'max:255', 'unique:products,sku,' . $product->id],
            'satuan'       => ['nullable', 'string', 'max:50'],
            'stok'         => ['nullable', 'integer', 'min:0'],
            'stok_minimum' => ['nullable', 'integer', 'min:0'],
            'harga_beli'   => ['nullable', 'numeric', 'min:0'],
            'harga_umum'   => ['required', 'numeric', 'min:0'],
            'harga_mitra'  => ['required', 'numeric', 'min:0'],
            'is_active'    => ['nullable', 'boolean'],
        ]);

        $product->update($data);

        return response()->json($product->load(['category:id,nama', 'brand:id,nama']));
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Produk dihapus.']);
    }
}