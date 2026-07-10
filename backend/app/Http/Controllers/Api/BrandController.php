<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::where('is_active', true)->withCount('products');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return $query->orderBy('nama')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'nama'        => ['required', 'string', 'max:255'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $brand = Brand::create($data);

        return response()->json($brand->load('category:id,nama'), 201);
    }

    public function show(Brand $brand)
    {
        return $brand->load(['category:id,nama', 'products']);
    }

    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'nama'        => ['required', 'string', 'max:255'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $brand->update($data);

        return response()->json($brand->load('category:id,nama'));
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();

        return response()->json(['message' => 'Brand dihapus.']);
    }
}