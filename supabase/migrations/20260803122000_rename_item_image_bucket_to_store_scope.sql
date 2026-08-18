update storage.buckets
set id = 'store_item_images',
    name = 'store_item_images'
where id = 'menu_item_images';

update storage.objects
set bucket_id = 'store_item_images'
where bucket_id = 'menu_item_images';
