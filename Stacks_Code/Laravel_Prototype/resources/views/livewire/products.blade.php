<div>
  <h2 class="font-bold text-xl mb-4">My Products</h2>
  @if (session('ok')) <div class="text-green-600">{{ session('ok') }}</div> @endif

  <form wire:submit.prevent="create" class="space-y-2">
    <input class="border p-2 w-full" placeholder="Name" wire:model="name">
    <textarea class="border p-2 w-full" placeholder="Description" wire:model="description"></textarea>
    <button class="px-4 py-2 bg-black text-white">Add</button>
  </form>

  <ul class="mt-6 space-y-2">
    @foreach($myProducts as $p)
      <li class="border p-3 flex justify-between">
        <div>
          <div class="font-semibold">{{ $p->name }}</div>
          <div class="text-gray-600 text-sm">{{ $p->description }}</div>
        </div>
        <button wire:click="delete({{ $p->id }})" class="text-red-600">Delete</button>
      </li>
    @endforeach
  </ul>
</div>
