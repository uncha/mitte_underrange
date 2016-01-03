var regEngNum = /^[A-Za-z0-9]+$/;
var regNum = /^[0-9]+$/;
var regKor = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
var regEmail=/^[-A-Za-z0-9_]+[-A-Za-z0-9_.]*[@]{1}[-A-Za-z0-9_]+[-A-Za-z0-9_.]*[.]{1}[A-Za-z]{2,5}$/;

(function($){
    $(function(){

        /* board list */
        $('#search-form').on('submit', function(e){
            if($(this).find('[name=searchValue]').val() == 0){
                alert('검색어를 입력해 주시기 바랍니다.');
                $(this).find('[name=searchValue]').focus();
                return false;
            }
        });

        /* board view */
        $('#deleteBtn').on('click', function(e){
            e.preventDefault();
            var isDelete = confirm('삭제하시겠습니까?');
            if(isDelete){
                location.href = $(this).attr('href');
            }
        });

        /* board write,update,reply form */
        $('#write-form').on('submit', function(e){
            if($(this).find('[name=subject]').val().length == 0){
                alert('제목을 입력해 주세요.');
                $(this).find('[name=subject]').focus();
                return false;
            }

            if($(this).find('[name=writer]').val().length == 0){
                alert('작성자를 입력해 주세요.');
                $(this).find('[name=writer]').focus();
                return false;
            }

            if($(this).find('[name=password]').val().length < 4){
                alert('비밀번호를 4자이상 입력해 주세요.');
                $(this).find('[name=password]').focus();
                return false;
            }

            if($(this).find('[name=content]').val().length == 0){
                alert('내용을 입력해 주세요.');
                $(this).find('[name=content]').focus();
                return false;
            }
        });

        /* board delete form */
        $('#delete-form').on('submit', function(e){
            if($(this).find('[name=password]').val().length < 4){
                alert('비밀번호를 4자이상 입력해 주세요.');
                $(this).find('[name=password]').focus();
                return false;
            }
        });

        /* 회원가입 폼 */
        $('#register-form').on('submit', function(e){
            if($(this).find('[name=user_id]').val().length < 5){
                alert('아이디를 5자 이상 입력해 주세요.');
                $(this).find('[name=user_id]').focus();
                return false;
            }

            if(!regEngNum.test($(this).find('[name=user_id]').val())){
                alert('영문 숫자만 입력 가능 합니다.');
                $(this).find('[name=user_id]').focus();
                return false;
            }

            if($(this).find('[name=password]').val().length < 6){
                alert('비밀번호를 6자 이상 입력해 주세요.');
                $(this).find('[name=password]').focus();
                return false;
            }

            if($(this).find('[name=password]').val() != $(this).find('[name=password2]').val()){
                alert('비밀번호 재확인이 비밀번호와 같지 않습니다.');
                $(this).find('[name=password2]').focus();
                return false;
            }

            if($(this).find('[name=name]').val().length == 0){
                alert('이름을 입력해 주세요.');
                $(this).find('[name=name]').focus();
                return false;
            }

            if(!regKor.test($(this).find('[name=name]').val())){
                alert('한글만 입력 가능 합니다.');
                $(this).find('[name=name]').focus();
                return false;
            }

            if($(this).find('[name=email]').val().length == 0){
                alert('이메일을 입력해 주세요.');
                $(this).find('[name=email]').focus();
                return false;
            }

            if(!regEmail.test($(this).find('[name=email]').val())){
                alert('이메일이 유효하지 않습니다.');
                $(this).find('[name=email]').focus();
                return false;
            }

            if($(this).find('[name=birth-year]').val().length < 4){
                alert('생년월일의 년도를 4자 입력해 주세요.');
                $(this).find('[name=birth-year]').focus();
                return false;
            }

            if(!regNum.test($(this).find('[name=birth-year]').val())){
                alert('숫자만 입력 가능 합니다.');
                $(this).find('[name=birth-year]').focus();
                return false;
            }

            if($(this).find('[name=phone]').val().length == 0){
                alert('핸드폰 번호를 입력해 주세요.');
                $(this).find('[name=phone]').focus();
                return false;
            }

            if(!regNum.test($(this).find('[name=phone]').val())){
                alert('숫자만 입력 가능 합니다.');
                $(this).find('[name=phone]').focus();
                return false;
            }
        });
        
        // 회원가입폼 아이디 중복 확인
        $('#register-form .search-user-id').click(function(){
            if($('#register-form [name=user_id]').val().length < 5){
                alert('아이디를 5자 이상 입력해 주세요.');
                $('#register-form [name=user_id]').focus();
                return false;
            }

            if(!regEngNum.test($('#register-form [name=user_id]').val())){
                alert('영문 숫자만 입력 가능 합니다.');
                $('#register-form [name=user_id]').focus();
                return false;
            }

            var searchUID = $('#register-form [name=user_id]').val();
            location.href="/member/register_form/" + searchUID;
        });

    });
}(jQuery));

// admin delete member func
function deleteMember(id, page){
    var isDelete = confirm('삭제 하시겠습니까?');
    if(isDelete){
        var redirect = '/admin/member/' + page;
        location.href='/admin/member/delete_process/' + id + '?redirect=' + redirect;
    }
}