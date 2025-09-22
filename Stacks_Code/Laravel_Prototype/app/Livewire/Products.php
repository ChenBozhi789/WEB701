<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class Products extends Component
{
    public $name, $description;

    // create a new product 
    public function create()
    {
        // validate the request data
        $this->validate(['name'=>'required|min:2']);
        // create a new product
        Product::create([
            'user_id'=>Auth::id(),
            'name'=>$this->name,
            'description'=>$this->description,
        ]);

        // reset the form
        $this->reset(['name','description']);
        // show success message
        session()->flash('ok','Product created.');
    }

    // delete a product
    public function delete($id)
    {
        Product::where('id',$id)->where('user_id',Auth::id())->delete();
    }

    // render the component
    public function render()
    {
        $myProducts = Product::where('user_id',Auth::id())->latest()->get();
        return view('livewire.products', compact('myProducts'));
    }
}
