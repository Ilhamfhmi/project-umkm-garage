<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $query->where('nama', 'ilike', '%' . $request->search . '%')
                  ->orWhere('no_hp', 'ilike', '%' . $request->search . '%');
        }

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        return $query->orderBy('nama')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama'   => ['required', 'string', 'max:255'],
            'no_hp'  => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'tipe'   => ['required', 'in:umum,mitra'],
        ]);

        return response()->json(Customer::create($data), 201);
    }

    public function show(Customer $customer)
    {
        return $customer->load('sales');
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'nama'   => ['required', 'string', 'max:255'],
            'no_hp'  => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'tipe'   => ['required', 'in:umum,mitra'],
        ]);

        $customer->update($data);

        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json(['message' => 'Pelanggan dihapus.']);
    }
}